import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'lnl0qvmy',
    dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  },
  studioHost: 'lnl0qvmy',
  deployment: {
    appId: 'em8gjooy67vqw56dond9098q',
  },
})
