# ChampionsPrep Blog — Master Product + Design Spec (v2)

> \*\*⚠️ Architecture is final. Do not redesign or introduce additional frameworks.\*\*

---

## Static Validation

Nothing in this PRD requires a backend. All features are static or client-side-minimal:

|Feature|Implementation|Backend?|
|-|-|-|
|Pagefind search|Static index built at deploy|❌ No|
|OG images|Build-time generation via satori|❌ No|
|Micro feedback|GA4 custom events only|❌ No|
|Share buttons|Static URL templates|❌ No|
|Reading time|Word count at build|❌ No|
|Dark mode|CSS + localStorage|❌ No|
|Related posts|Build-time scoring|❌ No|
|Tag pages|Static generation per tag|❌ No|
|Table of Contents|Build-time heading extraction|❌ No|

---

# 1\. Product Overview

Build a high-performance editorial blog using:

* Astro (latest)
* Tailwind CSS v4 (CSS-first configuration)
* MDX content
* Static-first architecture

This blog:

* lives at `/blog` on main domain
* is a separate repo/project
* contains ZERO backend logic
* is optimized for SEO + reading experience.

---

# 2\. Architecture Rules (STRICT)

DO NOT implement:

* backend APIs
* databases
* CMS dashboards
* authentication
* runtime rendering
* SSR unless explicitly needed.

Publishing workflow:

1. Duplicate MDX template
2. Write content
3. Commit
4. Deploy

---

# 3\. Tech Stack

Framework:

* Astro

Integrations:

* @astrojs/mdx
* @astrojs/sitemap
* @astrojs/rss

Styling:

* Tailwind CSS v4
* CSS-first design tokens

Search:

* Pagefind (static search index, built at deploy time, zero backend)

OG Image Generation:

* satori (build-time generation from post title + brand template)

---

# 4\. Project Structure

```
src/
  components/
    SignupCTA.astro
    ExamTip.astro
    RelatedPosts.astro
    AuthorCard.astro
    ShareButtons.astro
    TableOfContents.astro
    ReadingProgress.astro
    SearchWidget.astro
    PrevNextNav.astro
    Breadcrumbs.astro
    MicroFeedback.astro

  content/
    config.ts
    blog/
      \_template.mdx

  layouts/
    BlogLayout.astro

  pages/
    blog/
      index.astro
      \[...slug].astro
      tag/
        \[tag].astro

  styles/
    tokens.css
    global.css
    typography.css
    print.css
```

---

# 5\. Content Model (Astro Content Collections)

Frontmatter schema:

```
title: string
description: string
date: date
updatedDate?: date
author: string (default: "ChampionsPrep")
tags: string\[]
cluster: string
draft?: boolean
minutesRead?: number (auto-calculated at build time)
ogImage?: string (auto-generated if not provided)
```

Reading time is auto-calculated from word count (~200 wpm) during build.

---

# 6\. Brand Design System

## Primary Brand Color

Lavender-driven identity.

Primary:

```
--color-lavender-500: #8B7CF6
--color-lavender-600: #6D5CF5
--color-lavender-soft: #F3F1FF
```

Neutrals:

```
--color-text-primary: #111827
--color-text-secondary: #4B5563
--color-border: #E5E7EB
--color-bg: #FFFFFF
```

Dark mode overrides:

```
--color-text-primary: #F3F4F6
--color-text-secondary: #9CA3AF
--color-border: #374151
--color-bg: #111827
```

Lavender is accent color — NOT full background.

---

# 7\. Tailwind v4 Design Tokens

Define in CSS:

```css
:root {
  --color-lavender-500: #8B7CF6;
  --color-lavender-600: #6D5CF5;
  --color-lavender-soft: #F3F1FF;

  --reading-width: 720px;
  --shape-radius: 12px;
}
```

---

# 8\. Editorial Layout System

## Reading Width

max-width: 720px

## Typography

Font:

* Inter (primary — free, widely supported)

Scale:

```
H1 → 36px
H2 → 28px
H3 → 22px
Body → 17px
```

Line height: 1.75 – 1.8

---

# 9\. Editorial Typography (AUTO STYLING)

Apply class: `.editorial`

Rules:

* Lavender link color
* Diamond motif before H2
* Blockquotes with lavender border
* Lists with lavender markers
* Improved paragraph spacing.

Example:

```css
.editorial h2::before {
  content: "";
  width: 8px;
  height: 8px;
  background: var(--color-lavender-500);
  transform: rotate(45deg);
}
```

---

# 10\. Geometric Brand Identity

Primary shape: Rotated square (diamond).

Use for:

* heading markers
* callouts
* subtle background accents.

DO NOT use heavy decorative shapes.

---

# 11\. UX Polish \& Motion

## Motion (subtle only)

Page load: opacity 0 → 1, translateY 12px → 0, duration 300ms.

CTA hover: scale(1.02).

## Required UX Features

* Reading progress bar (thin lavender bar at top of viewport)
* Anchor links on headings (hover to reveal link icon)
* Animated underline links
* Smooth scroll
* Consistent spacing rhythm
* Rounded images (border-radius: var(--shape-radius))
* Subtle hover microinteractions

## Heading ID Generation

Generate slugified IDs for all H2/H3 headings at build time (e.g., `## Profit \& Loss` → `id="profit-loss"`).

Rules:

* Lowercase, hyphenated, stripped of special characters
* Generated at build time via Astro rehype plugin — no runtime JS
* Required for anchor links and TOC deep-linking to work reliably

## Reading Flow

* Narrow reading column (720px max)
* Short intro paragraph
* Section chunking with clear heading hierarchy
* Visual anchors every few screens
* Consistent heading spacing

---

# 12\. Navigation \& Discovery

## Tag Pages

Auto-generated at `/blog/tag/\[tag]` during build. Lists all posts with that tag, sorted by date.

## Client-Side Search

Pagefind integration — builds a search index at deploy time. Renders as a lightweight search widget on the blog index page. Zero backend.

## Previous / Next Navigation

Links to adjacent posts within the same cluster, displayed at post bottom.

## Breadcrumbs

Format: `Blog > \[Cluster] > \[Post Title]`

Rendered as structured data (BreadcrumbList schema) for SEO.

## Table of Contents

Auto-generated from H2/H3 headings in each post.

* Desktop (≥1024px): sticky sidebar alongside reading column
* Mobile (<1024px): collapses automatically into an accordion above content

TOC must collapse automatically below 1024px viewport. No exceptions — otherwise mobile layout breaks.

Pure CSS positioning + minimal JS for active-section highlighting.

---

# 13\. Engagement \& Growth

## Share Buttons

Static share links (no third-party SDKs):

* WhatsApp (critical for Indian student audience)
* Twitter/X
* Copy link to clipboard

Displayed at post bottom and optionally as a floating side bar on desktop.

## Micro-Feedback

Two buttons: 👍 👎 at post bottom.

Fires GA4 custom event (`article\_feedback` with `value: helpful | not\_helpful`). No backend storage needed.

## SignupCTA

Lavender primary button. Fires GA4 event (`cta\_click`).

Placed after ~40% scroll or at end of post.

## Author Card

Small component at post bottom showing author name, one-line bio, and optional avatar. Builds credibility for exam-prep content.

---

# 14\. SEO Architecture

Auto-generated:

* Canonical URLs
* sitemap.xml
* RSS feed
* JSON-LD `BlogPosting` schema (title, description, datePublished, author, image)
* JSON-LD `BreadcrumbList` schema
* JSON-LD `FAQPage` schema (for posts using Q\&A format — triggered by a `faq: true` frontmatter flag)

Open Graph:

* Auto-generated OG images at build time using satori — post title + brand template
* `og:title`, `og:description`, `og:image` meta tags on every post

Related Posts:

* Scoring system (computed at build time):

  * +3 points: same `cluster`
  * +1 point: per matching tag

* Sort by score (descending), then by date (newest first)
* Limit: 3 posts
* Fallback: if fewer than 3 scored results, fill with most recent posts from any cluster.

---

# 15\. Components Summary

|Component|Purpose|
|-|-|
|SignupCTA|Lavender CTA button with GA4 event|
|ExamTip|Soft lavender callout with diamond motif|
|RelatedPosts|Top 3 related articles by cluster/tags|
|AuthorCard|Author name + bio at post bottom|
|ShareButtons|WhatsApp, X, copy-link (static links)|
|TableOfContents|Auto-generated from headings|
|ReadingProgress|Thin lavender bar at viewport top|
|SearchWidget|Pagefind-powered search|
|PrevNextNav|Adjacent posts in same cluster|
|Breadcrumbs|Blog > Cluster > Post|
|MicroFeedback|👍👎 buttons firing GA4 events|

---

# 16\. Dark Mode

Implementation: class-based dark mode using `html.dark` class.

* Toggle button adds/removes `dark` class on `<html>`
* Preference stored in `localStorage`
* On load: check `localStorage` first, fall back to `prefers-color-scheme`
* Use `html.dark` rather than `@media (prefers-color-scheme: dark)` alone — allows manual toggle and avoids hydration issues

Scope: swap background, text, and border tokens. Lavender accent stays the same.

---

# 17\. Print Stylesheet

`@media print` CSS block that:

* Hides nav, footer, CTA, share buttons, progress bar, TOC sidebar
* Removes background colors
* Optimizes typography for paper
* Shows full URLs after links
* Code blocks: `white-space: pre-wrap; word-wrap: break-word;` to ensure lines wrap on paper

Students print articles — this costs nothing and helps them.

---

# 18\. Performance Rules

## Static Rendering Mode (EXPLICIT)

```
// astro.config.mjs
export default defineConfig({
  output: 'static'
});
```

All pages are pre-rendered at build time. No SSR. No server runtime. If a feature cannot work with `output: 'static'`, it is rejected.

## Rules

* output: static (enforced — see above)
* minimal JS (allowed: progress bar, TOC highlight, search widget, dark mode toggle, Pagefind)
* avoid hydration unless necessary
* lazy-load images below the fold
* preload Inter font

---

# 19\. Analytics

GA4 script (loaded async).

Track:

* page\_view (automatic)
* cta\_click (SignupCTA)
* article\_feedback (MicroFeedback 👍👎)
* share\_click (ShareButtons, with platform label)
* search\_query (Pagefind usage)

---

# 20\. Design Philosophy

Visual style: Editorial + Academic + Calm Modern.

NOT:

* flashy startup design
* heavy gradients
* excessive animations.

---

# FINAL RULE

If any feature introduces:

* server runtime
* database
* admin UI

Reject it. Prefer static alternative.

