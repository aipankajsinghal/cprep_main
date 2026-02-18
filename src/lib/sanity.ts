import { createClient } from '@sanity/client'

/**
 * Sanity client configured from environment variables.
 *
 * Required env vars:
 *   SANITY_PROJECT_ID  – your Sanity project ID
 *   SANITY_DATASET     – dataset name (defaults to "production")
 *   SANITY_API_VERSION – API version date (defaults to "2024-01-01")
 *   SANITY_API_TOKEN   – read token (required for draft previews)
 */
export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET ?? 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION ?? '2024-01-01',
  // useCdn: true speeds up public reads; disable when you need fresh data or for preview
  useCdn: import.meta.env.PROD === true,
  // Provide a token only if you need to query unpublished/draft documents
  token: import.meta.env.SANITY_API_TOKEN,
})
