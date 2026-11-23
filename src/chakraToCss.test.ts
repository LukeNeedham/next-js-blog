import { expect, test } from 'vitest'
import { chakraToCss } from './chakraToCss'

// A stand-in for the Chakra system: resolves nothing, and nests a media query as Chakra does
const system = {
  css: (style: Record<string, unknown>) => style,
}

test('style props become CSS declarations, in kebab case', () => {
  expect(chakraToCss(system, { '.a': { marginBottom: '8px', color: 'red' } })).toBe(
    '.a {\n    margin-bottom: 8px;\n    color: red;\n}\n',
  )
})

test('a nested media query becomes a media rule', () => {
  const css = chakraToCss(system, {
    '.a': { color: 'red', '@media (min-width: 48em)': { color: 'blue' } },
  })
  expect(css).toContain('@media (min-width: 48em) {\n    .a {\n        color: blue;\n    }\n}')
})
