export type Commit = { sha: string; subject: string; ago: string }

export type WorkingTree = { staged: number; modified: number; untracked: number }

export type Branch = {
  name: string
  upstream?: string
  ahead: number
  behind: number
  base: string
  commits: Commit[]
  tree: WorkingTree
}

export type CheckState = 'pass' | 'fail' | 'pending'

export type Check = { name: string; state: CheckState }

export type Review = { login: string; state: 'approved' | 'changes' | 'commented' | 'requested' }

export type Pr = {
  number: number
  title: string
  url: string
  state: 'open' | 'draft' | 'merged' | 'closed'
  author: string
  base: string
  additions: number
  deletions: number
  changedFiles: number
  decision?: 'approved' | 'changes' | 'required'
  mergeable?: string
  checks: Check[]
  reviews: Review[]
  labels: string[]
  comments: number
  updatedAt: string
}

export type Info =
  | { kind: 'no-repo' }
  | { kind: 'repo'; branch: Branch; pr: Pr | null; prError?: string; fetchedAt: number }

declare module 'claude-code' {
  interface PluginState {
    'pr-details': { info: Info | null; isLoading: boolean }
  }
}
