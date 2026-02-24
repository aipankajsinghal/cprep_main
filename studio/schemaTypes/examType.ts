import { defineField, defineType } from 'sanity'
import { ClipboardIcon } from '@sanity/icons'

export const examType = defineType({
  name: 'exam',
  title: 'Entrance Exam',
  type: 'document',
  icon: ClipboardIcon,
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      rows: 3,
    }),
    defineField({
      name: 'examDate',
      type: 'string',
      title: 'Exam Date',
      description: 'e.g. June 2026',
    }),
    defineField({
      name: 'eligibility',
      type: 'string',
      title: 'Eligibility',
    }),
    defineField({
      name: 'chapters',
      type: 'array',
      title: 'Chapters List',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'body',
      type: 'markdown',
      title: 'Body (Markdown)',
    }),
  ],
})
