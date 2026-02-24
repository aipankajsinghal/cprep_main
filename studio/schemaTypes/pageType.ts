import { defineField, defineType } from 'sanity'
import { DocumentsIcon } from '@sanity/icons'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  icon: DocumentsIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      group: 'content',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title' },
      group: 'content',
    }),
    defineField({
      name: 'body',
      type: 'markdown',
      title: 'Body',
      group: 'content',
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Meta Description',
      group: 'seo',
    }),
    defineField({
      name: 'metaTitle',
      type: 'string',
      title: 'Meta Title',
      group: 'seo',
    }),
    defineField({
      name: 'noIndex',
      type: 'boolean',
      title: 'No Index',
      initialValue: false,
      group: 'seo',
    }),
  ],
})
