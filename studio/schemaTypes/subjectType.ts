import { defineField, defineType } from 'sanity'
import { BookIcon } from '@sanity/icons'

export const subjectType = defineType({
  name: 'subject',
  title: 'Subject',
  type: 'document',
  icon: BookIcon,
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
      name: 'icon',
      type: 'string',
      title: 'Icon Name',
      description: 'Lucide icon name (e.g. calculator, book)',
    }),
    defineField({
      name: 'keyTopics',
      type: 'array',
      title: 'Key Topics',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'chapters',
      type: 'array',
      title: 'Chapters',
      of: [
        {
          type: 'object',
          name: 'chapter',
          fields: [
            defineField({ name: 'name', type: 'string', title: 'Chapter Name' }),
            defineField({ name: 'price', type: 'number', title: 'Price' }),
            defineField({ name: 'description', type: 'text', title: 'Description', rows: 2 }),
          ],
        },
      ],
    }),
    defineField({
      name: 'class',
      type: 'string',
      title: 'Class',
      options: {
        list: [
          { title: 'Class 11', value: '11' },
          { title: 'Class 12', value: '12' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'markdown',
      title: 'Body (Markdown)',
      description: 'Detailed content for the subject page.',
    }),
  ],
})
