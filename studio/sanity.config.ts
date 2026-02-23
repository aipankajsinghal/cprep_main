import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { markdownSchema } from 'sanity-plugin-markdown'
import { presentationTool } from 'sanity/presentation'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'
import { trendsPlugin } from './plugins/TrendsTool'
import { aiAssistantPlugin } from './plugins/AIAssistant'

export default defineConfig({
  name: 'cprep-blog',
  title: 'ChampionsPrep Blog',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? 'lnl0qvmy',
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [
    structureTool({ structure }),
    (presentationTool as any)({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL ?? 'http://localhost:4321',
        previewMode: {
          enable: '/api/preview',
        },
      },
    }),
    visionTool(),
    markdownSchema() as any,
    trendsPlugin(),
    aiAssistantPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },
})
