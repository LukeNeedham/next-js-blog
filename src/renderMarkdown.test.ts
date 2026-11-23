import { expect, test } from 'vitest'
import { renderMarkdown } from './renderMarkdown'

test('markdown is rendered to HTML, raw HTML included', async () => {
  const html = await renderMarkdown('## Title\n\n<div class="x">raw</div>')
  expect(html).toContain('<h2>Title</h2>')
  expect(html).toContain('<div class="x">raw</div>')
})

test('code is highlighted', async () => {
  expect(await renderMarkdown('```js\nconst a = 1\n```')).toContain('hljs-keyword')
})

test('an image of the content repo is served from the site', async () => {
  expect(await renderMarkdown('![Plan](../images/plan.png)')).toContain(
    'src="/blog-images/plan.png"',
  )
})

test('an image in raw html is rewritten too', async () => {
  expect(await renderMarkdown('<img src="../images/a.jpg" alt="A">')).toContain(
    'src="/blog-images/a.jpg"',
  )
})

test('any other image is left alone', async () => {
  expect(await renderMarkdown('![x](https://example.com/x.png)')).toContain(
    'src="https://example.com/x.png"',
  )
})
