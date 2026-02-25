# Architecture

## Core Principles

- Static first
- Content-driven
- Editorial-focused
- Performance-first always

## Hard Constraints

- No database (relational)
- No SSR conversion
- No route redesign
- No heavy UI/runtime frameworks

## Runtime Model

- Astro output mode is `server` (to support API routes and Sanity Preview).
- Most content is fetched from Sanity CMS and can be pre-rendered using `export const prerender = true`.
- Previews use the dynamic server mode to fetch draft content securely.

## Build Pipeline

1. `prebuild`: generate OG images (`scripts/generate-og.mjs`) and Instagram briefs (`scripts/generate-ig-briefs.mjs`) – both fetch from Sanity.
2. `build`: Astro static build (fetches from Sanity via `sanityClient`).
3. `postbuild`: Pagefind index generation.

## Content + Rendering

- Primary Source: Sanity CMS (Post documents)
- Schema: Managed in `studio/schemaTypes`
- Rendering logic: `src/pages/blog/[...slug].astro` fetches from Sanity via GROQ queries.
- Routes:
  - `src/pages/blog/index.astro`
  - `src/pages/blog/[...slug].astro`
  - `src/pages/blog/tag/[tag].astro`

## Styling System

- Tokens: `src/styles/tokens.css`
- Global/base: `src/styles/global.css`
- Editorial typography: `src/styles/typography.css`
- Print styles: `src/styles/print.css`

## Search and Discovery

- Pagefind static index (`dist/pagefind`)
- Table of contents from heading data
- Tag pages generated at build time
- Related posts scored from cluster/tags

## SEO Data Layer

Implemented as static metadata + build-time structured data:

- Canonical links
- Open Graph / Twitter tags
- Sitemap
- RSS
- JSON-LD:
  - BlogPosting
  - BreadcrumbList
  - LearningResource
  - cluster learning path ItemList
  - FAQPage (frontmatter-driven)

## AI Layer

Hybrid behavior in InlineAssistant:

1. Runtime cache (in-memory)
2. Static response file (`public/data/assistant-responses.json`)
3. Optional runtime proxy call (`/api/inline-ai`)

Smart context extraction sends nearest learning section context only.

## Exception Route

`api/inline-ai.ts` is a minimal stateless edge proxy for secure AI key usage.
It is not used for content persistence, CMS behavior, or server-rendered page logic.
