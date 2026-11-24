import { expect, test } from 'vitest'
import { imagePath, parseArticle } from './parseArticle'

const fields = { title: 'text', summary: 'text', date: 'date' } as const

const source = `---
title: "Light: and Material"
summary: A summary
date: 2026-09-12
---
First paragraph.
`

test('reads the front matter and leaves the markdown', () => {
  expect(parseArticle('a', source, fields)).toEqual({
    meta: { title: 'Light: and Material', summary: 'A summary', date: '2026-09-12' },
    body: 'First paragraph.\n',
    draft: false,
  })
})

test('a date stays the text it is', () => {
  expect(parseArticle('a', source, fields).meta.date).toBe('2026-09-12')
})

test('a long value that an editor wraps over several lines is read whole', () => {
  const wrapped = `---
title: T
summary: >-
  A summary that is long enough for
  an editor to wrap it over lines.
date: 2026-01-01
---
x`
  expect(parseArticle('a', wrapped, fields).meta.summary).toBe(
    'A summary that is long enough for an editor to wrap it over lines.',
  )
})

test('an article with no front matter is an error that names the file', () => {
  expect(() => parseArticle('a', 'Just text', fields)).toThrow('articles/a.md has no front matter')
})

test('a missing field is an error that names it', () => {
  expect(() => parseArticle('a', '---\ntitle: T\ndate: 2026-01-01\n---\nx', fields)).toThrow(
    "articles/a.md has no 'summary'",
  )
})

test('an empty field is missing', () => {
  expect(() =>
    parseArticle('a', '---\ntitle: T\nsummary:\ndate: 2026-01-01\n---\nx', fields),
  ).toThrow("'summary'")
})

test('a date that is not YYYY-MM-DD is an error', () => {
  expect(() =>
    parseArticle('a', '---\ntitle: T\nsummary: S\ndate: 7/11/2026\n---\nx', fields),
  ).toThrow('YYYY-MM-DD')
})

test('YAML that cannot be read is an error that names the file', () => {
  expect(() => parseArticle('a', '---\ntitle: [oops\n---\nx', fields)).toThrow('articles/a.md')
})

test('an image is the path relative to images, however the editor wrote it', () => {
  const imageFields = { title: 'text', image: 'image', date: 'date' } as const
  for (const written of [
    'junie.png',
    'images/junie.png',
    '/images/junie.png',
    '../images/junie.png',
  ]) {
    const article = `---\ntitle: T\nimage: ${written}\ndate: 2026-01-01\n---\nx`
    expect(parseArticle('a', article, imageFields).meta.image).toBe('junie.png')
  }
  expect(imagePath('sub/dir/a.png')).toBe('sub/dir/a.png')
})

test('an article is not a draft unless its front matter says so', () => {
  expect(parseArticle('a', source, fields).draft).toBe(false)
  expect(parseArticle('a', source.replace('date:', 'draft: false\ndate:'), fields).draft).toBe(
    false,
  )
})

test('a draft is read without its fields being checked', () => {
  expect(parseArticle('a', '---\ntitle: T\ndraft: true\n---\nx', fields)).toEqual({
    meta: {},
    body: 'x',
    draft: true,
  })
})
