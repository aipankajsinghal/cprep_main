# Scheduled Blog Publishing Guide

## Overview

Your blog now supports **scheduled publishing**. Draft posts automatically appear on their scheduled publish date without manual intervention.

---

## How It Works

### 1. **Post Frontmatter**

Add a `publishDate` field to your MDX frontmatter:

```yaml
---
title: "Your Post Title"
description: "Post description"
date: 2026-02-14
publishDate: 2026-03-01
author: "ChampionsPrep"
tags:
  - tag-1
  - tag-2
cluster: tips-tricks
draft: false
---
```

**Fields:**
- `date`: When the post was written (used for sorting)
- `publishDate`: When the post should go live (optional)
- `draft: false`: Must be `false` for publishing (set to `true` to hide)

### 2. **Automatic Publishing**

The site filters posts during each build:
- Posts with no `publishDate` appear immediately
- Posts with `publishDate` in the past appear immediately
- Posts with `publishDate` in the future are hidden until that date arrives

### 3. **Scheduled Rebuilds**

A Netlify scheduled function rebuilds your site **daily at 00:00 UTC**:
- The function triggers a new build automatically
- Any posts with upcoming `publishDate` values become visible
- Updates RSS feed, sitemap, and Instagram briefs

---

## Setup (One-Time)

### 1. Set Netlify Environment Variables

In Netlify dashboard: **Site Settings → Environment Variables**

Add these two variables:

```
NETLIFY_SITE_ID=your-site-id-here
NETLIFY_AUTH_TOKEN=your-auth-token-here
```

**Where to get them:**

1. **NETLIFY_SITE_ID**: Site settings → API ID (copy this directly)
2. **NETLIFY_AUTH_TOKEN**: Create a new personal access token
   - Go to Account → Applications → Tokens
   - Click "New access token"
   - Name it "Scheduled Publish"
   - Give it `builds:write` permission
   - Copy the token

### 2. Verify Setup

Check Netlify Functions logs to confirm scheduled builds trigger:
- Go to **Site Settings → Functions**
- Monitor the `publish-scheduled-posts` function logs

---

## Instagram Brief Generation

### Auto-Generated Briefs

Every build generates an Instagram-ready brief for each post:

**File**: `public/data/instagram-briefs.json`

**Each brief includes:**
- Post title and description
- Blog post URL
- Pre-formatted hashtags
- Ready-to-copy Instagram caption

### Example JSON:

```json
{
  "slug": "sample-post",
  "title": "Important Concept Explained",
  "description": "A deep dive into taxation...",
  "url": "https://www.championsprep.in/blog/sample-post/",
  "hashTags": "#tax #commerce #exam",
  "status": "scheduled",
  "publishDate": "2026-03-01",
  "daysUntilPublish": 12,
  "caption": "A deep dive into taxation...\n\nRead full article: https://www.championsprep.in/blog/sample-post/\n\n#tax #commerce #exam"
}
```

### How to Post on Instagram

1. **View Briefs**: Open `/data/instagram-briefs.json` in your browser
2. **Find Your Post**: Look for `status: "scheduled"`
3. **Copy Caption**: Copy the `caption` field
4. **Post to Instagram**: Paste into Instagram Business account
5. Done! 📱

---

## Workflow Example

### Scenario: Batch 5 Posts for Monthly Publishing

**Jan 15, 2026** - You write 5 posts:

```
post-1.mdx: publishDate: 2026-02-01
post-2.mdx: publishDate: 2026-02-08
post-3.mdx: publishDate: 2026-02-15
post-4.mdx: publishDate: 2026-02-22
post-5.mdx: publishDate: 2026-03-01
```

**What happens:**
- Jan 15: All 5 posts are invisible (draft status via `publishDate`)
- Feb 01 at 00:00 UTC: Site rebuilds → `post-1` appears
- Feb 08 at 00:00 UTC: Site rebuilds → `post-2` appears
- ... and so on
- Instagram briefs update automatically with each rebuild

---

## Scheduling Options

### Daily Rebuild (Default)
```toml
schedule = "0 0 * * *"  # Every day at 00:00 UTC
```

### Multiple Builds Per Day (Faster Publishing)

Edit `netlify/functions/publish-scheduled-posts.js`:

```javascript
# Hourly
export const config = { schedule: "0 * * * *" };

# Every 6 hours
export const config = { schedule: "0 0,6,12,18 * * *" };

# Every 4 hours
export const config = { schedule: "0 0,4,8,12,16,20 * * *" };
```

---

## Troubleshooting

### Scheduled Function Not Running

1. **Check Netlify Dashboard**:
   - Site Settings → Functions → `publish-scheduled-posts`
   - Look for recent executions

2. **Verify Environment Variables**:
   - Confirm `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` are set
   - Check for typos

3. **Manual Rebuild**:
   - Go to **Netlify Dashboard → Deploys → Trigger Deploy**
   - Select branch → **Deploy site**

### Post Not Appearing on Scheduled Date

1. Check post has `publishDate` in frontmatter
2. Ensure `draft: false` (important!)
3. Verify date format: `YYYY-MM-DD`
4. Check it's future date (e.g., `2026-03-01`)

### Instagram Briefs Not Updating

Check `public/data/instagram-briefs.json` exists:
- Run: `pnpm build` locally
- File should generate during prebuild

---

## File Changes Summary

### Modified Files
- `src/content/config.ts` - Added `publishDate` schema
- `src/content/blog/_template.mdx` - Added `publishDate` to template
- `src/pages/blog/index.astro` - Filter logic for future dates
- `src/pages/blog/tag/[tag].astro` - Filter logic for future dates
- `src/pages/blog/[...slug].astro` - Filter logic for future dates
- `src/pages/rss.xml.ts` - Filter logic for future dates
- `package.json` - Updated prebuild script
- `netlify.toml` - Added scheduled builds config

### New Files
- `scripts/generate-ig-briefs.mjs` - Instagram brief generator
- `netlify/functions/publish-scheduled-posts.js` - Scheduled rebuild trigger

---

## Notes

- **Time Zone**: All rebuild times are in **UTC** (00:00 UTC = 5:30 AM IST)
- **Build Logs**: Check Netlify deploy history for build details
- **Rollback**: Delete `publishDate` field to immediately publish a post
- **Free Plan**: Netlify's free tier supports 125,000 build minutes/month (daily rebuilds = ~44 minutes/month)

---

## Questions?

For support on Astro scheduled builds or Netlify configuration, check:
- [Netlify Scheduled Functions](https://docs.netlify.com/functions/scheduled-functions/)
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/)
