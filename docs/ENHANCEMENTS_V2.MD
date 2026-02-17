# Feature Implementation — Build-Time OpenGraph Image Generator

## Goal

Automatically generate a branded OpenGraph (`og:image`) PNG file for every blog post at build time, and link each to the appropriate `<meta property="og:image">` tag in the blog post head.

Design: 1200×630 image with
- deep purple gradient background
- CP monogram
- dynamic post title
- “Insights by ChampionsPrep” footer text

Constraints:
- Static generation only (no runtime APIs)
- Use Satori to generate an SVG from JSX
- Use resvg (@resvg/resvg-js) to convert SVG → PNG
- Save generated images to `/public/og/{slug}.png`
- Update blog templates to set correct OG image URLs
- Works on Netlify build

## What to Implement

### 1. Install Dependencies

Add build tool dependencies:

pnpm add -D satori @resvg/resvg-js

Also install a font (e.g., Inter) so text renders correctly:
pnpm add -D @fontsource/inter

### 2. New Build Script
Create a new script at:
scripts/generate-og.mjs

Script should:
1) Read all blog post metadata (use `astro:content` API to list blog entries).
2) For each post:
   - Build OG JSX template using its `title`
   - Call `satori(template, { width: 1200, height: 630, fonts: [...] })`
   - Convert SVG string to PNG with `resvg.render().asPng()`
   - Write PNG to `public/og/{slug}.png`
3) Ensure fonts are loaded and passed to Satori.

### 3. Template Function
Write a function `createOgTemplate({ title })` that returns JSX representing the card:
- gradient purple background
- CP monogram/logo
- blog title text
- footer “Insights by ChampionsPrep”

### 4. Run Script During Build
Update `package.json`:
"scripts": {
"prebuild": "node scripts/generate-og.mjs",
"build": "astro build"
}

So OG images are created before the static build runs.

### 5. Update Blog Layout Head
In your blog post layout (e.g., `BlogLayout.astro` or `blog/[...slug].astro`):
Add dynamic OG meta tags:
```astro
---
const slug = entry.slug;
const ogImageUrl = `/og/${slug}.png`;
---
<head>
  <meta property="og:image" content={ogImageUrl} />
  <meta property="twitter:image" content={ogImageUrl} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  ...
</head>
6. Validation
Build locally with npm run build

Check that public/og/{slug}.png is created for each post

Test sharing link on social preview tools (OpenGraph debugger)

Error Handling
If a title is extremely long, clamp text size or line wrap
Ensure fallback if fonts fail
Do not crash build on missing title

Acceptance Criteria
Unique OG image is generated per blog post

Images are served from /og/{slug}.png
<meta property="og:image"> is correct for every post
Build does not slow significantly
Social previews show branded image on share
Deliver all files and snippets needed including:
scripts/generate-og.mjs
template function
blog layout head updates

---
## 🔧 Notes Based on Best Practices
* You can generate OG images at build time using Satori + resvg, converting JSX to SVG then to PNG — this is a common Astro pattern. :contentReference[oaicite:0]{index=0}  
* You’ll need to embed fonts manually because Satori needs font data. :contentReference[oaicite:1]{index=1}  
* Confirm your Astro config `site` field is set so absolute URLs are correct. :contentReference[oaicite:2]{index=2}

---

Also extend this system to include:
- auto-generating Twitter card tags  
- caching logic so only new/updated blogs regenerate images  
