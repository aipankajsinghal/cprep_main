/**
 * GROQ queries for fetching content from Sanity.
 * All queries filter out drafts and future-dated posts by default.
 */

/** Fields returned for list views (no body – keeps payloads small) */
const POST_LIST_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  date,
  publishDate,
  updatedDate,
  author,
  "tags": tags[]->{title, "slug": slug.current},
  cluster,
  draft,
  minutesRead,
  ogImage,
  faqItems,
  quiz
`

/** Shared filter: published, non-draft, not future-dated */
const PUBLISHED_FILTER = `_type == "post" && draft != true && (!defined(publishDate) || publishDate <= now())`

/** All tags for navigation (resolved from references) */
export const TAGS_QUERY = `*[${PUBLISHED_FILTER}] { "tags": tags[]->{title, "slug": slug.current} }`

/** All published posts sorted newest-first (no body) */
export const ALL_POSTS_QUERY = `*[${PUBLISHED_FILTER}] | order(date desc) {${POST_LIST_FIELDS}}`

/** Slugs of all published posts (for getStaticPaths) */
export const ALL_SLUGS_QUERY = `*[${PUBLISHED_FILTER}] { "slug": slug.current }`

/** Single post by slug including body */
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug && draft != true && (!defined(publishDate) || publishDate <= now())][0] {
  ${POST_LIST_FIELDS},
  body
}`

/** Site settings singleton */
export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]`

/** Subjects queries */
export const ALL_SUBJECTS_QUERY = `*[_type == "subject"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  icon,
  keyTopics,
  chapters,
  class
}`

export const SUBJECT_BY_SLUG_QUERY = `*[_type == "subject" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  icon,
  keyTopics,
  chapters,
  class,
  body
}`

/** Exams queries */
export const ALL_EXAMS_QUERY = `*[_type == "exam"] | order(title asc) {
  _id,
  title,
  "slug": slug.current,
  description,
  examDate,
  eligibility
}`

export const EXAM_BY_SLUG_QUERY = `*[_type == "exam" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  examDate,
  eligibility,
  chapters,
  body
}`

/** Generic Pages query */
export const PAGE_BY_SLUG_QUERY = `*[_type == "page" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  description,
  metaTitle,
  noIndex,
  body
}`

/** Site Data queries */
export const FAQS_QUERY = `*[_type == "faq"] | order(order asc)`
export const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(_createdAt desc)`
export const FEATURES_QUERY = `*[_type == "feature"]`
export const PRICING_PLANS_QUERY = `*[_type == "pricingPlan"] | order(order asc)`
