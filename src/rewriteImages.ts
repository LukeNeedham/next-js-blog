/** A node of the rehype tree: only what is needed here, so the plugin has no dependency on the tree types. */
interface Node {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

/** Articles refer to their images as `../images/name.png` (so they show on GitHub too): the site serves them here. */
const articleImages = '../images/'
export const siteImages = '/blog-images/'

function rewrite(node: Node) {
  const src = node.properties?.src
  if (node.tagName === 'img' && typeof src === 'string' && src.startsWith(articleImages)) {
    node.properties!.src = siteImages + src.slice(articleImages.length)
  }
  node.children?.forEach(rewrite)
}

/** A rehype plugin that points the images of an article at the copy the site serves. */
export function rewriteImages() {
  return (tree: Node) => rewrite(tree)
}
