import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'
import remarkRehype from 'remark-rehype'
import rehypeSlug from 'rehype-slug'
import rehypeKatex from 'rehype-katex'
import rehypeStringify from 'rehype-stringify'
import type { Root, Text } from 'hast'
import { visit } from 'unist-util-visit'

export interface Heading {
  depth: number
  slug: string
  text: string
}

/**
 * Converts a Markdown string (with optional LaTeX math) to HTML.
 * Mirrors the remark/rehype pipeline used by @astrojs/mdx in this project.
 * Returns the HTML string and an array of extracted headings for the TOC.
 */
export async function markdownToHtml(markdown: string): Promise<{ html: string; headings: Heading[] }> {
  const headings: Heading[] = []

  function collectHeadings() {
    return (tree: Root) => {
      visit(tree, 'element', (node) => {
        if (!/^h[1-6]$/.test(node.tagName)) return
        const depth = parseInt(node.tagName[1], 10)
        const id = (node.properties?.id as string) ?? ''
        const text = node.children
          .filter((c): c is Text => c.type === 'text')
          .map((c) => c.value)
          .join('')
        headings.push({ depth, slug: id, text })
      })
    }
  }

  const file = await unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeKatex)
    .use(collectHeadings)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown)

  return { html: String(file), headings }
}

/**
 * Quick word-count based reading-time estimate (≈200 wpm).
 * Strips markdown syntax before counting so headings/links don't skew the count.
 */
export function calculateMinutesRead(markdown: string): number {
  const stripped = markdown
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/`[^`]+`/g, '')        // inline code
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[.*?\]\(.*?\)/g, '$1') // links (keep label text)
    .replace(/#+\s/g, '')           // headings
    .replace(/[*_~`]/g, '')         // emphasis
    .replace(/\$\$[\s\S]*?\$\$/g, '[math]') // block math
    .replace(/\$[^$]+\$/g, '[math]') // inline math
  const words = stripped.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
