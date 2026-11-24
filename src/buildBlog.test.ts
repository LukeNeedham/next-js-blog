import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { buildBlog } from './buildBlog'

let dir: string
let content: string

async function write(file: string, text: string) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, text)
}

beforeEach(async () => {
  dir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-'))
  content = path.join(dir, 'content-repo')
  vi.stubEnv('BLOG_CONTENT_DIR', content)
  vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(async () => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  await fs.rm(dir, { recursive: true, force: true })
})

const options = () => ({
  contentRepo: 'owner/blog-content',
  fields: { title: 'text', image: 'image', date: 'date' } as const,
  articleCss: '.blog-article { color: red; }\n',
  root: path.join(dir, 'site'),
})

const article = (image: string) =>
  `---\ntitle: One\nimage: ${image}\ndate: 2026-09-12\n---\nHello ![pic](../images/pic.png)\n`

test('writes the articles, their HTML, the CSS and the images', async () => {
  await write(path.join(content, 'articles', 'one.md'), article('thumb.png'))
  await write(path.join(content, 'images', 'thumb.png'), 'thumb')
  await write(path.join(content, 'images', 'pic.png'), 'pic')

  await buildBlog(options())

  const generated = path.join(dir, 'site', 'src', 'generated')
  expect(
    JSON.parse(await fs.readFile(path.join(generated, 'blog-articles.json'), 'utf-8')),
  ).toEqual([{ id: 'one', title: 'One', image: '/blog-images/thumb.png', date: '2026-09-12' }])
  const html = JSON.parse(await fs.readFile(path.join(generated, 'blog-html.json'), 'utf-8'))
  expect(html.one).toContain('src="/blog-images/pic.png"')
  expect(await fs.readFile(path.join(generated, 'blog-article.css'), 'utf-8')).toContain(
    '.blog-article { color: red; }',
  )
  expect(
    await fs.readFile(path.join(dir, 'site', 'public', 'blog-images', 'thumb.png'), 'utf-8'),
  ).toBe('thumb')
})

test('an image that is not in the content repo fails the build, naming it', async () => {
  await write(path.join(content, 'articles', 'one.md'), article('missing.png'))
  await fs.mkdir(path.join(content, 'images'), { recursive: true })

  await expect(buildBlog(options())).rejects.toThrow(
    "articles/one.md: 'image' is 'missing.png', which is not in images.",
  )
})

test('an invalid article fails the build, naming the file', async () => {
  await write(path.join(content, 'articles', 'bad.md'), 'no front matter')
  await expect(buildBlog(options())).rejects.toThrow('articles/bad.md has no front matter')
})

test('a content repo with no images folder is fine when no article has an image', async () => {
  await write(path.join(content, 'articles', 'one.md'), '---\ntitle: One\ndate: 2026-01-01\n---\nx')
  await expect(
    buildBlog({ ...options(), fields: { title: 'text', date: 'date' } }),
  ).resolves.toBeUndefined()
})

test('a download that fails fails the build, with the address', async () => {
  vi.stubEnv('BLOG_CONTENT_DIR', '')
  vi.stubGlobal('fetch', async () => new Response('', { status: 404, statusText: 'Not Found' }))
  await expect(buildBlog(options())).rejects.toThrow(
    'Could not download the blog content from https://codeload.github.com/owner/blog-content/tar.gz/refs/heads/main: 404 Not Found.',
  )
  vi.unstubAllGlobals()
})

test('a draft is left out of the list and the HTML', async () => {
  await write(path.join(content, 'articles', 'one.md'), '---\ntitle: One\ndate: 2026-01-01\n---\nx')
  await write(
    path.join(content, 'articles', 'wip.md'),
    '---\ntitle: Wip\ndate: 2026-01-02\ndraft: true\n---\ny',
  )
  await buildBlog({ ...options(), fields: { title: 'text', date: 'date' } })
  const generated = path.join(dir, 'site', 'src', 'generated')
  const list = JSON.parse(await fs.readFile(path.join(generated, 'blog-articles.json'), 'utf-8'))
  expect(list.map((it: { id: string }) => it.id)).toEqual(['one'])
  const html = JSON.parse(await fs.readFile(path.join(generated, 'blog-html.json'), 'utf-8'))
  expect(Object.keys(html)).toEqual(['one'])
})
