export type Slice = { name: string; tokens: number; color: string; kind: 'used' | 'free' | 'buffer' }

export type Snapshot = {
  total: number
  max: number
  percent: number
  compactAt?: number
  slices: Slice[]
}

declare module 'claude-code' {
  interface PluginState {
    'context-bar': { snapshot: Snapshot | null; isHidden: boolean; isCollapsed: boolean }
  }
}
