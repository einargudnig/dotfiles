import { expect, test } from 'claude-code/testing'

import { frontmatter, parseAgent, summary } from '../hooks/agents'

test('frontmatter reads plain, quoted and block scalars', async () => {
  const fm = frontmatter(
    ['---', 'name: reviewer', 'description: "Reviews diffs.\\n\\nExamples: x"', 'model: sonnet', 'notes: |', '  line one', '  line two', 'voice:', '  speed: 1', '---', 'body'].join('\n'),
  )
  expect(fm.name).toBe('reviewer')
  expect(fm.description).toBe('Reviews diffs.\n\nExamples: x')
  expect(fm.model).toBe('sonnet')
  expect(fm.notes).toBe('line one\nline two')
  expect(fm.speed).toBeUndefined()
})

test('summary keeps the first paragraph on one line', async () => {
  expect(summary('Finds slow code.\nSpots N+1.\n\nExamples:\n- a')).toBe('Finds slow code. Spots N+1.')
  expect(summary('Search the vault.\n\nExamples:\n- x')).toBe('Search the vault.')
})

test('parseAgent falls back to file name and inherit', async () => {
  expect(parseAgent('docs-writer.md', '---\ndescription: Writes docs\n---\n')).toEqual({
    name: 'docs-writer',
    description: 'Writes docs',
    model: 'inherit',
    color: undefined,
  })
})
