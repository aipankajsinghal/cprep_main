# ChampionsPrep Blog

Static-first editorial blog for ChampionsPrep, built with Astro + MDX.

## Overview

- Output mode: static
- Content source: repository MDX files
- Styling: Tailwind CSS v4 + CSS tokens
- Search: Pagefind static index
- SEO: build-time metadata + JSON-LD + sitemap + RSS
- Design: editorial, academic, lavender + diamond motif
- CMS: Sanity.io (Content Lake + Sanity Studio)

## Tech Stack

- Astro
- Sanity.io
- `@astrojs/mdx` (for local documentation/templates)
- `@astrojs/sitemap`
- `@astrojs/rss`
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Pagefind
- Satori + Resvg (build-time OG images)

## Project Structure

```text
api/
  inline-ai.ts
public/
  blog/og/
  data/assistant-responses.json
  icons/
  manifest.webmanifest
  sw.js
src/
  components/
  content/
    blog/ (Astro Content Collections - legacy/templates)
    config.ts
  layouts/
  pages/
    blog/
  styles/
  utils/
scripts/
  generate-og.mjs
studio/ (Sanity Studio project)
```

## Local Development (PowerShell)

### Blog Site
```powershell
npm install
npm run dev
```

### Sanity Studio
```powershell
cd studio
npm install
npm run dev
```

Build production output:

```powershell
npm run build
```

## Content Workflow

1. Open Sanity Studio (`cd studio && npm run dev`) or access via Sanity.io.
2. Create or edit "Post" documents.
3. Publish changes in Sanity.
4. Trigger a new build/deploy (Vercel) to pull fresh content.

Legacy MDX workflow (for developer notes or templates):
1. Copy `src/content/blog/_template.mdx`
2. Fill frontmatter and content

## Required Frontmatter

```yaml
title: "Post Title"
description: "Post description"
date: 2026-01-01
author: "ChampionsPrep"
tags:
  - sample
cluster: foundation
draft: false
```

Optional fields:

```yaml
updatedDate: 2026-01-15
minutesRead: 5
ogImage: /blog/og/custom.png
faqItems:
  - q: "Question?"
    a: "Answer."
```

## Hybrid Inline AI

Inline assistant is progressive and backend-optional:

1. Runtime cache (in-memory)
2. Static response (`public/data/assistant-responses.json`)
3. Optional runtime enhancement (`POST /api/inline-ai`)

The site remains usable when backend runtime is unavailable.

## SEO + Structured Data

Each post includes:

- `BlogPosting`
- `BreadcrumbList`
- `LearningResource`
- cluster `ItemList` learning path
- optional `FAQPage` (only when `faqItems` exists)

Also generated:

- `sitemap.xml`
- `rss.xml`
- canonical links
- Open Graph/Twitter metadata

## Documentation

- `CPrep_Blog_Prd.md` - primary PRD with enhancement addendum
- `docs/ARCHITECTURE.md` - architecture constraints and runtime model
- `docs/COMPONENTS.md` - component responsibilities and behavior
- `docs/OPERATIONS.md` - env vars, build/deploy, troubleshooting

Changing authors
