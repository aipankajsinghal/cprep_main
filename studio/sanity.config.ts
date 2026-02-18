import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { markdownSchema } from 'sanity-plugin-markdown'
import { schemaTypes } from './schemaTypes'
import { structure } from './structure'
import { trendsPlugin } from './plugins/TrendsTool'

export default defineConfig({
  name: 'cprep-blog',
  title: 'ChampionsPrep Blog',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID!,
  dataset: process.env.SANITY_STUDIO_DATASET ?? 'production',

  plugins: [
    structureTool({ structure }),
    visionTool(),
    markdownSchema(),
    trendsPlugin(),
  ],

  schema: {
    types: schemaTypes,
  },
})
