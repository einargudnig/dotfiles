import type { AgentDef } from '../types'

const unquote = (raw: string) => {
  const v = raw.trim()
  if (v.startsWith('"') && v.endsWith('"')) {
    try {
      return JSON.parse(v) as string
    } catch {
      return v.slice(1, -1)
    }
  }
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'")
  return v
}

export const frontmatter = (text: string): Record<string, string> => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)
  if (!match?.[1]) return {}

  const fields: Record<string, string> = {}
  const lines = match[1].split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(lines[i] ?? '')
    if (!kv?.[1]) continue
    const [, key, rest = ''] = kv
    if (/^[|>][-+]?$/.test(rest.trim())) {
      const block: string[] = []
      while (i + 1 < lines.length && /^(\s+|$)/.test(lines[i + 1] ?? '')) block.push((lines[++i] ?? '').trim())
      fields[key] = block.join(rest.trim().startsWith('>') ? ' ' : '\n').trim()
    } else {
      fields[key] = unquote(rest)
    }
  }
  return fields
}

export const summary = (description: string) =>
  (description.split(/\n\s*\n|\nExamples?:/i)[0] ?? '').replace(/\s+/g, ' ').trim()

export const parseAgent = (fileName: string, text: string): AgentDef => {
  const fm = frontmatter(text)
  return {
    name: fm.name || fileName.replace(/\.md$/, ''),
    description: summary(fm.description ?? ''),
    model: fm.model || 'inherit',
    color: fm.color || undefined,
  }
}
