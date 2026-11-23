import { spawnSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

/**
 * Returns the directory holding the blog content (it has `articles` and `images`).
 *
 * `BLOG_CONTENT_DIR` points at a local checkout of the content repo, and is used as it is: write an article there
 * and build to see it. Otherwise the latest `main` of the content repo (or the branch in `BLOG_CONTENT_REF`) is
 * downloaded into `content` of the site, so every build publishes the latest content. A failed download fails the
 * build: publishing a site with no articles would be worse.
 */
export async function fetchContent(root: string, contentRepo: string): Promise<string> {
  const local = process.env.BLOG_CONTENT_DIR
  if (local) {
    return path.resolve(local)
  }
  const ref = process.env.BLOG_CONTENT_REF || 'main'
  const url = `https://codeload.github.com/${contentRepo}/tar.gz/refs/heads/${ref}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Could not download the blog content from ${url}: ${response.status} ${response.statusText}.`,
    )
  }
  const dir = path.join(root, 'content')
  await fs.rm(dir, { recursive: true, force: true })
  await fs.mkdir(dir, { recursive: true })
  const extracted = spawnSync('tar', ['-xz', '--strip-components=1', '-C', dir], {
    input: Buffer.from(await response.arrayBuffer()),
  })
  if (extracted.status !== 0) {
    throw new Error(`Could not unpack the blog content: ${extracted.stderr.toString()}`)
  }
  return dir
}
