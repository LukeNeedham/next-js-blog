type StyleObject = Record<string, unknown>

/** What of a Chakra `system` is needed: it resolves style props (text styles, tokens, responsive values) to CSS. */
export interface ChakraSystem {
  css(style: never): unknown
}

function toKebabCase(property: string): string {
  return property.replace(/[A-Z]/g, (it) => `-${it.toLowerCase()}`)
}

function declarations(style: StyleObject, indent: string): string {
  return Object.entries(style)
    .filter(([, value]) => typeof value !== 'object')
    .map(([property, value]) => `${indent}${toKebabCase(property)}: ${value};\n`)
    .join('')
}

/**
 * Compiles Chakra style props to CSS rules, resolving them with the theme (`system`) of the site: so the styling of
 * an article, which is plain HTML, stays in step with the rest of the site. A site can use it to make its `articleCss`.
 */
export function chakraToCss(system: ChakraSystem, styles: Record<string, StyleObject>): string {
  return Object.entries(styles)
    .map(([selector, chakraStyle]) => {
      const resolved = system.css(chakraStyle as never) as StyleObject
      const mediaQueries = Object.entries(resolved)
        .filter(([, value]) => typeof value === 'object')
        .map(([query, nested]) => ({
          query,
          body: declarations(nested as StyleObject, '        '),
        }))
        .filter((it) => it.body !== '')
        .map(
          (it) =>
            `@media ${it.query.replace(/^@media /, '')} {\n    ${selector} {\n${it.body}    }\n}\n`,
        )
        .join('')
      return `${selector} {\n${declarations(resolved, '    ')}}\n${mediaQueries}`
    })
    .join('\n')
}
