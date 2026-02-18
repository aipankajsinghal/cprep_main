/**
 * migrate-to-sanity.mjs
 *
 * Reads all MDX posts from src/content/blog/ and outputs a Sanity NDJSON
 * import file (sanity-import.ndjson) that can be loaded with:
 *
 *   sanity dataset import sanity-import.ndjson production
 *
 * Usage:
 *   node scripts/migrate-to-sanity.mjs
 *
 * Prerequisites: pnpm install (gray-matter is already a dependency)
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { join, basename } from 'path'
import matter from 'gray-matter'
import { createHash } from 'crypto'

const BLOG_DIR = join(process.cwd(), 'src/content/blog')
const OUT_FILE = join(process.cwd(), 'sanity-import.ndjson')

const files = readdirSync(BLOG_DIR).filter(
  (f) => (f.endsWith('.mdx') || f.endsWith('.md')) && !f.startsWith('_')
)

const documents = []

for (const file of files) {
  const raw = readFileSync(join(BLOG_DIR, file), 'utf-8')
  const { data, content } = matter(raw)

  // Generate a stable _id from the slug so re-imports are idempotent
  const slug = basename(file, '.mdx').replace('.md', '')
  const id = 'post-' + createHash('md5').update(slug).digest('hex').slice(0, 12)

  const doc = {
    _id: id,
    _type: 'post',
    title: data.title ?? '',
    slug: { _type: 'slug', current: slug },
    description: data.description ?? '',
    date: data.date instanceof Date ? data.date.toISOString() : String(data.date),
    publishDate: data.publishDate instanceof Date
      ? data.publishDate.toISOString()
      : data.publishDate
        ? String(data.publishDate)
        : undefined,
    updatedDate: data.updatedDate instanceof Date
      ? data.updatedDate.toISOString()
      : data.updatedDate
        ? String(data.updatedDate)
        : undefined,
    author: data.author ?? 'ChampionsPrep',
    cluster: data.cluster ?? '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    draft: data.draft ?? false,
    minutesRead: data.minutesRead ?? undefined,
    ogImage: data.ogImage ?? undefined,
    faqItems: Array.isArray(data.faqItems)
      ? data.faqItems.map((item) => ({ _key: createHash('md5').update(item.q).digest('hex').slice(0, 8), ...item }))
      : undefined,
    quiz: data.quiz
      ? {
          ...data.quiz,
          questions: Array.isArray(data.quiz.questions)
            ? data.quiz.questions.map((q, i) => ({ _key: `q${i}`, ...q }))
            : [],
        }
      : undefined,
    // Trim frontmatter comment / h1 if it duplicates the title
    body: content.trim(),
  }

  // Remove undefined fields (Sanity rejects them)
  for (const key of Object.keys(doc)) {
    if (doc[key] === undefined) delete doc[key]
  }

  documents.push(doc)
  console.log(`  ✓ ${file} → ${id} (slug: ${slug})`)
}

writeFileSync(OUT_FILE, documents.map((d) => JSON.stringify(d)).join('\n'), 'utf-8')
console.log(`\nExported ${documents.length} post(s) to ${OUT_FILE}`)
console.log('\nNext step:')
console.log('  cd studio && sanity dataset import ../sanity-import.ndjson production')
