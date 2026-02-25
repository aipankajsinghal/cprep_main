import { unified } from 'unified'
import rehypeParse from 'rehype-parse'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * Sanitizes HTML content from CMS to prevent XSS attacks.
 * Allows safe HTML tags and attributes while removing scripts and event handlers.
 */
export async function sanitizeHtml(html: string): Promise<string> {
  if (!html) return ''

  const sanitizeSchema = {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] || []), 'className'],
      a: [...(defaultSchema.attributes?.a || []), 'target', 'rel'],
    },
  }

  const file = await unified()
    .use(rehypeParse)
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(html)

  return String(file)
}
