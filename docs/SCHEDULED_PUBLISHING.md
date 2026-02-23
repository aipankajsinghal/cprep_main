# Scheduled Blog Publishing Guide (Vercel)

## Overview

Your blog supports **scheduled publishing** via Sanity CMS and Vercel. Posts automatically appear on their scheduled publish date without manual intervention.

---

## How It Works

### 1. **Sanity Content**
In Sanity Studio, use the `publishDate` field. 
- If `publishDate` is in the future, the post will be hidden from the live site until that date.
- The build process fetches all posts and filters by date.

### 2. **Vercel Cron Jobs**
To ensure the site updates even if no content is manually published, you should set up a Vercel Cron job to rebuild the site daily.

In `vercel.json` (or via Vercel Dashboard):
```json
{
  "crons": [
    {
      "path": "/api/rebuild",
      "schedule": "0 0 * * *"
    }
  ]
}
```
*Note: This requires a minimal API route `/api/rebuild` that triggers a Vercel Deploy Hook.*

### 3. **Deployment Hooks**
1. Go to **Vercel Dashboard → Project Settings → Git → Deploy Hooks**.
2. Create a new hook (e.g., "Sanity Publish").
3. Copy the URL.
4. Go to **Sanity Management Console → API → Webhooks**.
5. Add the Vercel URL as a webhook to trigger on every publish.

---

## Instagram Brief Generation

Every build generates an Instagram-ready brief:
**File**: `public/data/instagram-briefs.json`

---

## Troubleshooting

1. **Post Not Appearing**: 
   - Ensure the post is "Published" in Sanity.
   - Check that `draft` is false.
   - Verify the `publishDate` is correct.
2. **Rebuild Not Triggering**:
   - Verify the Vercel Deploy Hook URL in Sanity Webhooks.
   - Check Vercel build logs for errors.
