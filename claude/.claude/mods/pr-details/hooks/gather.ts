import type { Branch, Check, CheckState, Commit, Info, Pr, Review, WorkingTree } from '../types'

export type Run = (argv: string[]) => Promise<{ ok: boolean; out: string; err: string }>

export const parseTree = (porcelain: string): WorkingTree =>
  porcelain
    .split('\n')
    .filter(Boolean)
    .reduce(
      (t, line) => {
        if (line.startsWith('??')) return { ...t, untracked: t.untracked + 1 }
        return {
          ...t,
          staged: t.staged + (line[0] !== ' ' ? 1 : 0),
          modified: t.modified + (line[1] !== ' ' ? 1 : 0),
        }
      },
      { staged: 0, modified: 0, untracked: 0 },
    )

export const parseCommits = (log: string): Commit[] =>
  log
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [sha = '', subject = '', ago = ''] = line.split('\t')
      return { sha, subject, ago }
    })

const FAILED = new Set(['FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'ERROR', 'STARTUP_FAILURE'])
const PASSED = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED'])

type RawCheck = { name?: string; context?: string; status?: string; conclusion?: string; state?: string }

export const checkState = (c: RawCheck): CheckState => {
  const result = (c.conclusion || c.state || '').toUpperCase()
  if (FAILED.has(result)) return 'fail'
  if (PASSED.has(result)) return 'pass'
  return 'pending'
}

const REVIEW_STATE: Record<string, Review['state']> = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'changes',
  COMMENTED: 'commented',
}

const DECISION: Record<string, Pr['decision']> = {
  APPROVED: 'approved',
  CHANGES_REQUESTED: 'changes',
  REVIEW_REQUIRED: 'required',
}

type RawPr = {
  number: number
  title: string
  url: string
  state: string
  isDraft: boolean
  author?: { login: string }
  baseRefName: string
  additions: number
  deletions: number
  changedFiles: number
  reviewDecision?: string
  mergeable?: string
  statusCheckRollup?: RawCheck[]
  latestReviews?: { author?: { login: string }; state: string }[]
  reviewRequests?: { login?: string; name?: string }[]
  labels?: { name: string }[]
  comments?: unknown[]
  updatedAt: string
}

const prState = (raw: RawPr): Pr['state'] => {
  if (raw.state === 'MERGED') return 'merged'
  if (raw.state === 'CLOSED') return 'closed'
  return raw.isDraft ? 'draft' : 'open'
}

export const parsePr = (json: string): Pr => {
  const raw = JSON.parse(json) as RawPr
  const checks: Check[] = (raw.statusCheckRollup ?? []).map(c => ({
    name: c.name || c.context || 'check',
    state: checkState(c),
  }))
  const reviews: Review[] = [
    ...(raw.latestReviews ?? []).flatMap(r => {
      const state = REVIEW_STATE[r.state]
      return state && r.author ? [{ login: r.author.login, state }] : []
    }),
    ...(raw.reviewRequests ?? []).map(r => ({ login: r.login ?? r.name ?? '?', state: 'requested' as const })),
  ]

  return {
    number: raw.number,
    title: raw.title,
    url: raw.url,
    state: prState(raw),
    author: raw.author?.login ?? '?',
    base: raw.baseRefName,
    additions: raw.additions,
    deletions: raw.deletions,
    changedFiles: raw.changedFiles,
    decision: raw.reviewDecision ? DECISION[raw.reviewDecision] : undefined,
    mergeable: raw.mergeable,
    checks,
    reviews,
    labels: (raw.labels ?? []).map(l => l.name),
    comments: raw.comments?.length ?? 0,
    updatedAt: raw.updatedAt,
  }
}

const PR_FIELDS = [
  'number', 'title', 'url', 'state', 'isDraft', 'author', 'baseRefName', 'additions', 'deletions',
  'changedFiles', 'reviewDecision', 'mergeable', 'statusCheckRollup', 'latestReviews', 'reviewRequests',
  'labels', 'comments', 'updatedAt',
].join(',')

const fetchPr = async (run: Run): Promise<{ pr: Pr | null; prError?: string }> => {
  const res = await run(['gh', 'pr', 'view', '--json', PR_FIELDS])
  if (res.ok) return { pr: parsePr(res.out) }
  if (/no pull requests found/i.test(res.err)) return { pr: null }
  return { pr: null, prError: res.err.split('\n')[0] || 'gh pr view failed' }
}

const defaultBase = async (run: Run) => {
  const head = await run(['git', 'symbolic-ref', '--short', 'refs/remotes/origin/HEAD'])
  return head.ok ? head.out : 'origin/main'
}

const aheadBehind = async (run: Run, upstream?: string) => {
  if (!upstream) return { ahead: 0, behind: 0 }
  const res = await run(['git', 'rev-list', '--left-right', '--count', `${upstream}...HEAD`])
  const [behind = 0, ahead = 0] = res.out.split(/\s+/).map(Number)
  return { ahead, behind }
}

export const gather = async (run: Run, now: number): Promise<Info> => {
  const head = await run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'])
  if (!head.ok) return { kind: 'no-repo' }

  const [upstreamRes, status, prResult] = await Promise.all([
    run(['git', 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']),
    run(['git', 'status', '--porcelain=v1']),
    fetchPr(run),
  ])
  const upstream = upstreamRes.ok ? upstreamRes.out : undefined
  const base = prResult.pr ? `origin/${prResult.pr.base}` : await defaultBase(run)
  const [counts, log] = await Promise.all([
    aheadBehind(run, upstream),
    run(['git', 'log', '--format=%h%x09%s%x09%cr', '-n', '10', `${base}..HEAD`]),
  ])

  const branch: Branch = {
    name: head.out,
    upstream,
    ...counts,
    base: base.replace(/^origin\//, ''),
    commits: log.ok ? parseCommits(log.out) : [],
    tree: parseTree(status.out),
  }

  return { kind: 'repo', branch, ...prResult, fetchedAt: now }
}
