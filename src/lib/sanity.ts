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
const isDev = import.meta.env.DEV
const previewToken = import.meta.env.SANITY_API_TOKEN

export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET ?? 'production',
  apiVersion: import.meta.env.SANITY_API_VERSION ?? '2024-01-01',
  useCdn: !isDev && !previewToken,
  token: previewToken,
  perspective: 'published', // Default to published
  stega: {
    enabled: isDev || !!previewToken,
    studioUrl: '/studio',
  },
})

export const getClient = (preview = false) => {
  if (preview && previewToken) {
    return sanityClient.withConfig({
      perspective: 'previewDrafts',
      useCdn: false,
      token: previewToken,
    })
  }
  return sanityClient
}
