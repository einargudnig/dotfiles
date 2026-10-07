export type AgentDef = {
  name: string
  description: string
  model: string
  color?: string
}

export type AgentGroup = {
  scope: 'project' | 'user'
  path: string
  agents: AgentDef[]
}

declare module 'claude-code' {
  interface PluginState {
    'agent-panel': { groups: AgentGroup[] | null; running: Record<string, number>; isOpen: boolean }
  }
}
