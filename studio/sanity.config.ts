import { defineConfig, PluginOptions } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { markdownSchema } from 'sanity-plugin-markdown'
import { presentationTool, type PresentationToolConfig } from 'sanity/presentation'
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
    presentationTool({
      previewUrl: {
        origin: process.env.SANITY_STUDIO_PREVIEW_URL ?? 'https://c-prep-blog.vercel.app',
        previewMode: {
          enable: '/api/preview',
        },
      },
    } as PresentationToolConfig),
    visionTool(),
    markdownSchema() as unknown as PluginOptions,
    trendsPlugin(),
    aiAssistantPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },
})
