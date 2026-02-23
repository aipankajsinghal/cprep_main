# Operations

## Requirements

- Node.js 20+
- npm
- Windows PowerShell commands for local usage

## Install

```powershell
npm install
```

## Run

```powershell
npm run dev
```

## Build

```powershell
npm run build
```

Build includes:

- OG image generation (`prebuild`)
- Astro static output
- Pagefind index generation (`postbuild`)

## Environment Variables

Required:

- `SANITY_PROJECT_ID`
- `SANITY_DATASET` (defaults to "production")
- `SANITY_API_VERSION` (defaults to "2024-01-01")
- `SANITY_API_TOKEN` (Required for build-time fetching and previews)

Optional:

- `PUBLIC_GA_MEASUREMENT_ID`
  - Enables GA event tracking.
- `OPENAI_API_KEY`
  - Used only by `api/inline-ai.ts` when runtime proxy is deployed.

## Deployment Notes

- Primary target: static hosting/CDN (Vercel).
- Content is pulled from Sanity during build.
- Deployment must be triggered manually or via Sanity Webhook when content is published.
- Runtime proxy `/api/inline-ai` is optional enhancement.
- Site behavior remains functional without runtime proxy because InlineAssistant has static fallback.

## PWA Notes

- Manifest: `public/manifest.webmanifest`
- Service worker: `public/sw.js`
- Icons: `public/icons/`

## Troubleshooting

- Missing search results:
  - Ensure `npm run build` completes and `pagefind` postbuild runs.
- Missing OG images:
  - Verify `scripts/generate-og.mjs` runs in `prebuild`.
- Inline assistant runtime not responding:
  - Check proxy deployment and `OPENAI_API_KEY`.
  - Static fallback should still render responses.
- FAQ rich results not appearing:
  - Ensure `faqItems` exists in post frontmatter.

Test
