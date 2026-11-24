# next-js-blog

The build step shared by my Next.js blogs, whose articles are markdown files in a separate content repo.

At build time it:

1. downloads the content repo (`main`, or `BLOG_CONTENT_REF`), or reads a local checkout (`BLOG_CONTENT_DIR`);
2. checks the front matter of each article, and that the images it names exist;
3. renders each article's markdown to HTML (raw HTML allowed, code highlighted);
4. copies the content repo's `images/` to `public/blog-images`;
5. writes `src/generated/blog-articles.json` (the list), `blog-html.json` (the HTML by article id) and
   `blog-article.css`, which is all the app has to import.

An article with `draft: true` in its front matter is left out of everything (and its fields are not checked).

A failure at any step fails the build with a message that names the article and the field.

## The content repo

```
articles/   one markdown file per article; the file name is its id
images/     the images the articles use
```

An article opens with YAML front matter. In the markdown, an image is `![Alt](../images/name.png)`, which also shows
on GitHub, and is served as `/blog-images/name.png`.

## Using it

Add it to the site at a tag, and run it from `scripts/build-blog.ts` (with `tsx`, as the `generate`, `predev`,
`prebuild`, `pretest` and `pretypecheck` scripts):

```
yarn add github:LukeNeedham/next-js-blog#v1.1.0
```

```ts
import { buildBlog, chakraToCss } from 'next-js-blog'
import { system } from '@/presentation/theme/system'
import { articleStyles } from './blog/articleStyles'

buildBlog({
  contentRepo: 'LukeNeedham/matthewpersonalwebsite-blogcontent',
  fields: { title: 'text', summary: 'text', date: 'date' },
  articleCss: chakraToCss(system, articleStyles),
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
```

### Options

| Option        | What                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `contentRepo` | The content repo, `owner/name`.                                                                      |
| `fields`      | The front matter every article must have, by name: `text`, `date` (`YYYY-MM-DD`) or `image` (below). |
| `articleCss`  | The CSS of an article, as text. `chakraToCss(system, styles)` makes it from Chakra style props.      |
| `root`        | The root of the site. The current folder by default.                                                 |

An `image` field is a path relative to the content repo's `images/` folder: `image: junie.png`. It is checked to exist,
and written to the articles list as `/blog-images/junie.png`. An editor that writes the folder too (`images/junie.png`,
`../images/junie.png`) is understood.

## Developing

```
yarn install
yarn lint
yarn test
```

Release by tagging (`v1.1.0`) and bump the tag in each site.

## License

All rights reserved. See [LICENSE](LICENSE).
