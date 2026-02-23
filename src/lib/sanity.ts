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
const projectId = import.meta.env.SANITY_PROJECT_ID

// Check if Sanity is properly configured
const isSanityConfigured = projectId && !projectId.includes('your_project_id')

let sanityClient: ReturnType<typeof createClient> | null = null

if (isSanityConfigured) {
  sanityClient = createClient({
    projectId,
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
}

export { sanityClient }

export const getClient = (preview = false) => {
  if (!sanityClient) {
    throw new Error('Sanity is not configured. Please set SANITY_PROJECT_ID environment variable.')
  }
  if (preview && previewToken) {
    return sanityClient.withConfig({
      perspective: 'previewDrafts',
      useCdn: false,
      token: previewToken,
    })
  }
  return sanityClient
}
