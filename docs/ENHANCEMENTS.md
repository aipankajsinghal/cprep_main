# ChampionsPrep Blog — Enhancement Spec v3

> **Architecture extensions are intentional and scoped. Each new edge function
> is a stateless proxy exception matching the existing `/api/inline-ai` pattern.
> Decap CMS is a static admin layer — no backend, no SSR, no database.**

---

## Status Key

| Symbol | Meaning |
|--------|---------|
| 🔴 | Critical bug — fix before any new work |
| 🟡 | Design/UX gap — address in this cycle |
| 🟢 | New feature — enhancement |

---

# 🔴 CRITICAL FIXES (Do First)

## Fix 1: Site URL Double-Pathing Bug

**Problem:** `astro.config.mjs` sets `site: "https://www.championsprep.in/blog"`.
All canonical URLs and JSON-LD use `new URL('/blog/${slug}/', Astro.site)` which
produces `https://www.championsprep.in/blog/blog/post-slug/`.

Every post's structured data (BlogPosting, BreadcrumbList, LearningResource,
ItemList) has broken URLs. Sitemap and RSS are also affected.

**Fix:**

```js
// astro.config.mjs
export default defineConfig({
  site: "https://www.championsprep.in",
  // ...rest unchanged
});
```

Then update all path constructions in:
- `src/pages/blog/[...slug].astro` — canonical, ogImageUrl, breadcrumb, learning path URLs
- `src/pages/blog/index.astro` — canonical
- `src/pages/blog/tag/[tag].astro` — canonical
- `src/pages/rss.xml.ts` — verify base URL

All should use `/blog/${slug}/` paths (which are correct when site is the root domain).

**Validation:** After fix, run `npm run build` and grep `dist/` for any
`/blog/blog/` occurrences. There should be zero.

---

## Fix 2: pnpm/npm Tooling Mismatch

**Problem:** `package.json` prebuild uses `pnpm -s node scripts/generate-og.mjs`
but documentation says `npm` and no pnpm lockfile exists.

**Fix:** Change prebuild script to:
```json
"prebuild": "node scripts/generate-og.mjs"
```

Or standardize on pnpm with a `pnpm-lock.yaml`. Pick one, not both.

---

## Fix 3: Missing Font Weights

**Problem:** Only Inter 400 is loaded. Headings, labels, CTA text all use
`font-weight: 600` which triggers faux bolding.

**Fix:** Add Inter 600 and 700 woff2 files to `public/fonts/` and register
them in `global.css`:

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-600-normal.woff2") format("woff2");
  font-style: normal;
  font-weight: 600;
  font-display: swap;
}

@font-face {
  font-family: "Inter";
  src: url("/fonts/inter-latin-700-normal.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
```

Also preload the 600 weight (used most after 400):
```html
<link rel="preload" href="/fonts/inter-latin-600-normal.woff2"
  as="font" type="font/woff2" crossorigin="anonymous" />
```

---

# 🟡 DESIGN & UX GAPS

## Gap 1: Color Scheme Alignment

**Problem:** Two color systems exist and neither matches the intended brand.

| Source | Lavender | Text Primary | Accent |
|--------|----------|-------------|--------|
| tokens.css (current) | #8B7CF6 | #111827 | #6D5CF5 |
| COLOR_SCHEME.md | #E6E6FA | #4E5764 | #6B5B95 |
| PRD original | #8B7CF6 | #111827 | #6D5CF5 |

The current tokens.css uses vibrant, saturated purples (#8B7CF6) which work
as accent but produce bland results because the rest of the palette is generic
gray-scale with no warmth, no depth, and no supporting colors.

COLOR_SCHEME.md introduces a richer palette (cream, gold, deep purple) but
uses different variable names (`--cp-*`) and a much more muted lavender
(#E6E6FA) that feels washed out as an accent.

**Resolution:** Merge the best of both into a unified token set. The blog
should use the ChampionsPrep brand palette from COLOR_SCHEME.md as its
foundation, adapted for editorial reading:

```css
:root {
  /* ── Brand Core ── */
  --color-purple-deep: #6B5B95;
  --color-purple-hover: #5A4A84;
  --color-purple-soft: #F5F3FF;
  --color-lavender: #E6E6FA;
  --color-lavender-light: #F5F3FF;
  --color-cream: #EEE9DD;
  --color-gold: #D4AF37;

  /* ── Text ── */
  --color-text-primary: #4E5764;
  --color-text-heading: #3A3F47;
  --color-text-secondary: #636C7A;

  /* ── Surfaces ── */
  --color-bg: #FFFFFF;
  --color-bg-warm: #FDFCFA;
  --color-bg-muted: #F8F7F4;
  --color-bg-section-alt: var(--color-lavender-light);

  /* ── Borders & Code ── */
  --color-border: #E2DFD9;
  --color-border-accent: color-mix(in srgb, var(--color-purple-deep), transparent 70%);
  --color-code-bg: #F6F5F2;

  /* ── Interactive ── */
  --color-link: var(--color-purple-deep);
  --color-link-hover: var(--color-purple-hover);
  --color-cta-bg: var(--color-purple-deep);
  --color-cta-text: #FFFFFF;
  --color-cta-hover: var(--color-purple-hover);

  /* ── Feedback ── */
  --color-success: #4CAF50;

  /* ── Layout ── */
  --reading-width: 720px;
  --shape-radius: 12px;
  --font-editorial: Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --line-height-body: 1.78;
}

html.dark {
  --color-text-primary: #E8E6E1;
  --color-text-heading: #F3F1ED;
  --color-text-secondary: #9CA3AF;
  --color-bg: #1A1814;
  --color-bg-warm: #1E1C17;
  --color-bg-muted: #252219;
  --color-bg-section-alt: #1E1C17;
  --color-border: #3D3830;
  --color-code-bg: #1E1C17;
  --color-cream: #2A261F;
  --color-lavender: #2D2940;
  --color-lavender-light: #252238;
}
```

Key design decisions:
- **Warm neutral base** (`--color-bg-warm: #FDFCFA`) instead of pure white — reduces eye strain for long reading
- **Cream from brand** used for card surfaces and alternating sections
- **Gold accent** available for badges, highlights, premium markers
- **Deep purple** (#6B5B95) as primary interactive color — more sophisticated than the saturated #8B7CF6
- **Text uses slate** from brand, not pure black — softer reading experience
- **Dark mode has warm undertones** to match the light theme's warmth

**Migration:** All components currently reference `--color-lavender-500`,
`--color-lavender-600`, `--color-lavender-soft`. Create aliases during
migration:

```css
:root {
  /* Aliases for migration (remove after all components updated) */
  --color-lavender-500: var(--color-purple-deep);
  --color-lavender-600: var(--color-purple-hover);
  --color-lavender-soft: var(--color-purple-soft);
}
```

---

## Gap 2: Missing Header & Footer

**Problem:** No site header, no footer. No way to navigate to main site.
No copyright. No internal linking for SEO.

**Create:** `src/components/SiteHeader.astro`

Content:
- ChampionsPrep logo/wordmark (left)
- Navigation: Blog, Tags (dropdown or inline), main site link
- Theme toggle (move from floating button into header)
- Responsive: hamburger on mobile

**Create:** `src/components/SiteFooter.astro`

Content:
- Copyright line
- Links: Blog, About ChampionsPrep, Privacy, Terms
- Social links (Instagram, X)
- "Built for Class 11-12 Commerce students"

**Update:** `BlogLayout.astro` to include both.

---

## Gap 3: Unstyled Blog Index & Tag Pages

**Problem:** Blog index and tag listing pages render bare `<ul>/<li>` with
no visual treatment. Doesn't match the editorial design of post pages.

**Fix:** Create a `PostCard.astro` component used on both index and tag pages:

- Card with subtle border, warm background
- Post title (linked, purple)
- Date + reading time + cluster badge
- Description excerpt (2 lines max)
- Tag chips (small pill badges)
- Hover: slight lift + border-accent

Blog index page additionally needs:
- Featured/latest post hero treatment (larger card at top)
- Cluster filter pills above the grid
- Proper page description and heading hierarchy

---

## Gap 4: Cluster Validation in Schema

**Problem:** `cluster` is `z.string()` — any value accepted.

**Fix:** Use `z.enum()` in `src/content/config.ts`:

```ts
cluster: z.enum([
  "taxation",
  "accountancy",
  "business-studies",
  "economics",
  "finance",
  "corporate-law",
  "tips-tricks",
  "shortcuts",
  "mindmaps",
  "quick-quiz"
]),
```

Build fails if an invalid cluster is used. This is the simplest
governance mechanism — no CMS dropdown needed.

---

## Gap 5: Replace Hand-Rolled Share Buttons with Shareon

**Problem:** Current `ShareButtons.astro` renders plain text links
("WhatsApp", "X", "Copy Link") with no icons, no visual weight, and
no native mobile share support. For an Indian student audience where
WhatsApp sharing is the primary distribution channel, these buttons
need to be immediately recognizable and tappable.

**Solution:** Replace with [Shareon](https://shareon.js.org/) — a
lightweight (< 7.5 kB), zero-dependency, privacy-respecting social
share library with built-in SVG icons.

Why Shareon fits the architecture:
- No third-party tracking or SDKs (PRD: "static share links, no third-party SDKs")
- Declarative HTML — no hydration, no framework dependency
- Built-in SVG icons for all supported platforms
- Native Web Share API button (`web-share`) for mobile — critical
  for Indian students sharing via phone
- CSS customizable via variables — matches brand token approach
- CDN-loadable or self-hostable

**Implementation:**

1. Load Shareon CSS and JS in `BlogLayout.astro`:

```html
<link href="https://cdn.jsdelivr.net/npm/shareon@2/dist/shareon.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/shareon@2/dist/shareon.iife.js" defer init></script>
```

Or self-host by downloading to `public/vendor/shareon/` to avoid
external CDN dependency (preferred for static-first philosophy).

2. Rewrite `src/components/ShareButtons.astro`:

```astro
---
interface Props {
  url: string;
  title: string;
  postSlug: string;
  cluster: string;
  instagramId?: string;
}
const {
  url, title, postSlug, cluster,
  instagramId = "champions.prep"
} = Astro.props as Props;
---
<section class="share-section" aria-label="Share this article">
  <p class="share-section__title">Share this article</p>
  <div class="shareon" data-url={url} data-title={title}>
    <a class="whatsapp"></a>
    <a class="twitter"></a>
    <a class="telegram"></a>
    <a class="linkedin"></a>
    <a class="instagram" href={`https://www.instagram.com/${instagramId}/`}
       target="_blank" rel="noopener noreferrer"
       title={`Follow @${instagramId}`}></a>
    <button class="copy-url"></button>
    <button class="web-share"></button>
  </div>
</section>
```

3. Override Shareon CSS to match brand tokens:

```css
.shareon > * {
  border-radius: 999px !important;
  transition: transform 180ms ease, opacity 180ms ease !important;
}
.shareon > *:hover {
  transform: translateY(-1px) !important;
}
```

4. Preserve GA tracking with explicit event delegation on the `.shareon`
   container. Use precise selectors to avoid false positives from
   non-button child elements:

```js
const shareContainer = document.querySelector('.shareon');
if (shareContainer) {
  const platformSelector = [
    '[class*="whatsapp"]',
    '[class*="twitter"]',
    '[class*="telegram"]',
    '[class*="linkedin"]',
    '[class*="instagram"]',
    '[class*="copy-url"]',
    '[class*="web-share"]'
  ].join(', ');

  shareContainer.addEventListener('click', (e) => {
    const btn = e.target.closest(platformSelector);
    if (!btn) return;
    const platform = btn.className.split(' ')[0] || 'unknown';
    if (typeof window.cpTrack === 'function') {
      window.cpTrack('share_click', {
        platform,
        post_slug: postSlug,
        cluster
      });
    }
  });
}
```

**Platforms to include:**
- WhatsApp (primary — Indian student audience)
- X/Twitter
- Telegram (popular with study groups)
- LinkedIn (parents, teachers)
- Instagram (profile link — critical for brand visibility and student engagement)
- Copy URL
- Web Share (native mobile share sheet — shows only on supported browsers)

**Instagram note:** Instagram doesn't support URL-based content sharing.
The Instagram button links to the ChampionsPrep profile page. This is
intentional — it drives followers and brand recognition, which is the
primary goal for the Indian student audience. The button renders alongside
share buttons for visual consistency but functions as a follow/visit link.

**Self-hosting option (recommended):**
Download `shareon.min.css` and `shareon.iife.js` to `public/vendor/shareon/`
to eliminate external CDN dependency. Update paths in layout accordingly.
This aligns better with the static-first, self-contained philosophy.

---

# 🟢 NEW FEATURES

## Feature 1: Decap CMS for Non-Technical Publishing

**Rationale:** Team members who aren't developers need to create and edit
posts without touching code or Git directly. Decap CMS is a static admin
layer — it commits to Git via GitHub/GitLab API. No backend, no database,
no SSR.

**Architecture note:** This is an intentional, scoped extension. Decap runs
entirely client-side from a static HTML page. It does not introduce server
rendering, databases, or a persistent backend. The "admin panel" is a
single static page that authenticates via GitHub OAuth and commits directly
to the repo.

### Files to create:

**`public/admin/index.html`**
```html
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>ChampionsPrep Blog Admin</title>
  <script src="https://unpkg.com/decap-cms@3/dist/decap-cms.js"></script>
</head>
<body></body>
</html>
```

**`public/admin/config.yml`**
```yaml
backend:
  name: github
  repo: <OWNER>/<REPO>
  branch: main

media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  - name: "blog"
    label: "Blog Posts"
    folder: "src/content/blog"
    create: true
    slug: "{{slug}}"
    extension: "mdx"
    format: "frontmatter"
    editor:
      preview: false
    fields:
      - { label: "Title", name: "title", widget: "string" }
      - { label: "Description", name: "description", widget: "string" }
      - { label: "Date", name: "date", widget: "datetime" }
      - { label: "Updated Date", name: "updatedDate", widget: "datetime", required: false }
      - { label: "Author", name: "author", widget: "string", default: "ChampionsPrep" }
      - { label: "Tags", name: "tags", widget: "list" }
      - label: "Cluster"
        name: "cluster"
        widget: "select"
        options:
          - taxation
          - accountancy
          - business-studies
          - economics
          - finance
          - corporate-law
          - tips-tricks
          - shortcuts
          - mindmaps
          - quick-quiz
      - { label: "Draft", name: "draft", widget: "boolean", default: true }
      - label: "FAQ Items"
        name: "faqItems"
        widget: "list"
        required: false
        fields:
          - { label: "Question", name: "q", widget: "string" }
          - { label: "Answer", name: "a", widget: "text" }
      - { label: "Body", name: "body", widget: "markdown" }
```

### Important limitations to document for the team:

1. Decap's markdown widget produces `.md`-flavored content but we use `.mdx`.
   Simple posts (text, headings, lists, links, images) work fine. MDX
   components (`<ExamTip>`, `<StudyTool>`, `<InlineAssistant>`) must be
   added by a developer after initial draft.

2. `faqItems` as a list widget works for structured Q&A but is less
   ergonomic than a rich editor. Consider whether FAQ items are common
   enough to warrant this in the CMS or if they're always developer-added.

3. Posts created via Decap are committed as PRs or direct commits to `main`.
   **Recommend:** Configure branch deploy previews on Vercel so drafts
   can be previewed before merge.

### Quality gate (recommended):

Add a GitHub Actions workflow that runs on PR:

```yaml
# .github/workflows/content-check.yml
name: Content Check
on: [pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      # Build succeeds = schema validates, no broken references
```

This ensures every CMS-created post passes Zod schema validation, heading
ID generation, and OG image generation before it reaches production.

---

## Feature 2: Trend Discovery Edge Function

**Rationale:** Help editorial team discover commerce-relevant trending topics
for timely content. This is a stateless proxy matching the existing
`/api/inline-ai` pattern.

### `api/trends.ts`

```
Endpoint: GET /api/trends
Runtime: edge
Auth: none (public, rate-limited)
External calls:
  1. Google Trends RSS (https://trends.google.com/trends/trendingsearches/daily/rss?geo=IN)
  2. Conditionally: OpenAI via OPENAI_API_KEY for semantic filtering

Response: JSON array of { topic, why_it_matters, suggested_angle, suggested_cluster }
```

**Logic:**
1. Fetch Google Trends RSS for India
2. Parse XML, extract top 20 topic titles
3. Keyword filter against commerce terms:
   `["tax", "gst", "budget", "rbi", "inflation", "economy", "economics",
   "finance", "bank", "stock", "market", "income", "corporate", "business",
   "commerce", "accountancy", "cbse", "icse", "class 11", "class 12"]`
4. If ≥5 keyword matches → return those (no AI call needed)
5. If <5 matches → send full list to OpenAI for semantic filtering with prompt:

```
You are an Indian commerce educator.
From these trending topics: [LIST]
Select up to 5 that are relevant to CBSE/ICSE Class 11-12 Commerce
(Taxation, Business Studies, Economics, Accountancy).
Return JSON array with: topic, why_it_matters, suggested_angle, suggested_cluster.
Return JSON only, no markdown.
```

**Security:**
- `OPENAI_API_KEY` read from Vercel env (never exposed to browser)
- Response capped at 5 items
- AI output truncated to prevent abuse
- Consider adding a simple API key header for admin-only access

---

## Feature 3: AI Draft Generation Edge Function

**Rationale:** Help non-technical team members generate first-draft content
that can be reviewed and edited.

### `api/generate-draft.ts`

```
Endpoint: POST /api/generate-draft
Runtime: edge
Auth: none (consider simple secret header)
Input: { topic: string, angle: string, cluster: string }
External calls: OpenAI via OPENAI_API_KEY

Response: { title, description, body, tags }
```

**Prompt:**
```
Write a structured blog post for Indian Class 11-12 Commerce students.

Topic: {topic}
Angle: {angle}
Cluster: {cluster}

Requirements:
- Clear introduction explaining relevance
- 4-6 sections with H2 headings
- Simple, accessible language
- At least one real-world Indian example
- Exam relevance noted where applicable
- Brief summary at end
- Do NOT include frontmatter

Output format: Return JSON with keys: title, description (1 sentence), body (markdown), tags (array of 3-5 strings).
Return JSON only.
```

**Security:**
- `OPENAI_API_KEY` from env
- `max_tokens: 2000`, `temperature: 0.4`
- Input validation: topic ≤160 chars, angle ≤200 chars, cluster must be from allowed list

**Quality note:** AI-generated drafts are always `draft: true`. The team
member reviews, edits, and explicitly marks as `draft: false` before
publish. The CI quality gate (Feature 1) provides an additional safety net.

---

## Feature 4: Admin Trends + Draft UI

**Rationale:** The editorial team needs a simple interface to discover trends
and generate drafts, accessible from the Decap admin area.

### Approach: Custom page alongside Decap

Since Decap CMS doesn't support custom dashboard widgets cleanly, create
a separate static page:

**`public/admin/trends.html`**

A standalone HTML page (vanilla JS, no framework) that:
1. Has a "Discover Trending Topics" button
2. Calls `GET /api/trends`
3. Renders results as cards: topic, why it matters, angle, cluster
4. Each card has "Generate Draft" button
5. Calls `POST /api/generate-draft`
6. Shows generated content in a preview pane
7. "Copy to Clipboard" button for pasting into Decap editor
8. Alternatively, "Create Post" button that opens Decap's new post page
   with pre-filled URL parameters (if Decap supports this)

**Styling:** Match the blog's brand tokens. Use the same CSS custom properties.

**Navigation:** Add link from Decap admin or as a separate bookmark:
`https://yourdomain.com/admin/trends.html`

---

## Feature 5: Service Worker Scope Fix

**Problem:** SW registers with `scope: "/blog/"` but this may conflict
depending on deployment path.

**Fix:** Verify scope matches actual deployment. If blog is deployed at
root of a Vercel project, scope should be `/`. If deployed as a subdirectory,
`/blog/` is correct but must match the actual URL structure.

---

# IMPLEMENTATION ORDER

1. 🔴 Fix site URL bug (blocks all SEO)
2. 🔴 Fix pnpm/npm mismatch (blocks builds)
3. 🔴 Add font weights (blocks visual quality)
4. 🟡 Implement new color tokens + migrate components
5. 🟡 Build header + footer
6. 🟡 Style blog index + tag pages (PostCard component)
7. 🟡 Add cluster enum validation
8. 🟡 Replace share buttons with Shareon
9. 🟢 Decap CMS setup + CI quality gate
10. 🟢 Trends edge function
11. 🟢 Draft generation edge function
12. 🟢 Admin trends UI

Steps 1-3 are independent and can be done in parallel.
Steps 4-8 form a visual refresh batch.
Steps 9-12 form the editorial tooling batch.

---

# ARCHITECTURE EXCEPTION LOG

| Exception | Type | Justification |
|-----------|------|---------------|
| `/api/inline-ai` | Edge proxy | Existing. Secure AI key proxy for InlineAssistant. |
| `/api/trends` | Edge proxy | New. Fetches Google Trends + optional AI filtering. Stateless. |
| `/api/generate-draft` | Edge proxy | New. AI draft generation. Stateless. |
| `/admin/` | Static HTML | New. Decap CMS client-side admin. No backend. |
| `/admin/trends.html` | Static HTML | New. Vanilla JS trend discovery UI. No backend. |

All exceptions are:
- Stateless (no database, no persistent storage)
- Edge-deployed (Vercel edge functions)
- Key-secure (no browser-side API key exposure)
- Fallback-safe (blog functions without any of these)

---

# ACCEPTANCE CRITERIA

- [ ] No `/blog/blog/` double-paths in any built output
- [ ] Build succeeds with `npm run build` (not pnpm)
- [ ] Inter 600/700 render correctly (no faux bold)
- [ ] Color tokens match unified brand palette
- [ ] Header and footer present on all pages
- [ ] Blog index shows styled post cards
- [ ] Invalid cluster values fail build
- [ ] Share buttons render with Shareon icons (WhatsApp, X, Telegram, LinkedIn, Instagram, Copy, Web Share)
- [ ] Share button GA tracking fires `share_click` with correct platform label
- [ ] Web Share button appears only on supported browsers (mobile)
- [ ] Decap admin accessible at `/admin/`
- [ ] Decap creates valid MDX files that pass build
- [ ] `/api/trends` returns commerce-filtered topics
- [ ] `/api/generate-draft` returns structured draft
- [ ] Admin trends page functional
- [ ] All CI checks pass on PR
- [ ] No architecture violations (no DB, no SSR, no persistent backend)