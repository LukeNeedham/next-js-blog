import { parse } from 'yaml'
import type { Fields } from './fields'

export interface ParsedArticle {
  /** The value of each field of the front matter, as a string (an image as the path relative to `images`) */
  meta: Record<string, string>
  /** The markdown after the front matter */
  body: string
}

const frontMatter = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** An editor may write the image with its folder: `images/a.png`, `/images/a.png` or `../images/a.png` all mean `a.png` */
export function imagePath(value: string): string {
  return value.replace(/^(\.{1,2}\/|\/)?(images\/)?/, '')
}

/**
 * Splits an article into its front matter (YAML between two `---` lines) and its markdown, and checks the fields.
 * Fails loudly, naming the file and the field, if one is missing or is not what its type says.
 */
export function parseArticle(id: string, source: string, fields: Fields): ParsedArticle {
  const file = `articles/${id}.md`
  const match = frontMatter.exec(source)
  if (match === null) {
    throw new Error(`${file} has no front matter (${Object.keys(fields).join(', ')}).`)
  }
  let data: unknown
  try {
    // The core schema keeps `2026-09-12` as the text it is, not a Date
    data = parse(match[1], { schema: 'core' })
  } catch (error) {
    throw new Error(`${file}: the front matter is not valid YAML: ${(error as Error).message}`)
  }
  const values = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>

  const meta: Record<string, string> = {}
  for (const [name, type] of Object.entries(fields)) {
    const raw = values[name]
    const value = raw === undefined || raw === null ? '' : String(raw).trim()
    if (value === '') {
      throw new Error(`${file} has no '${name}' in its front matter.`)
    }
    if (type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(`${file}: '${name}' must be a date, YYYY-MM-DD, not '${value}'.`)
    }
    meta[name] = type === 'image' ? imagePath(value) : value
  }
  return { meta, body: source.slice(match[0].length) }
}
