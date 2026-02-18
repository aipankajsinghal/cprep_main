import { defineField, defineType } from 'sanity'
import { DocumentTextIcon } from '@sanity/icons'

const CLUSTERS = [
  { title: 'Mathematics', value: 'maths' },
  { title: 'Taxation', value: 'taxation' },
  { title: 'Accountancy', value: 'accountancy' },
  { title: 'Business Studies', value: 'business-studies' },
  { title: 'Economics', value: 'economics' },
  { title: 'Finance', value: 'finance' },
  { title: 'Corporate Law', value: 'corporate-law' },
  { title: 'Tips & Tricks', value: 'tips-tricks' },
  { title: 'Shortcuts', value: 'shortcuts' },
  { title: 'Mindmaps', value: 'mindmaps' },
  { title: 'Quick Quiz', value: 'quick-quiz' },
]

export const postType = defineType({
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  icon: DocumentTextIcon,
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Metadata' },
    { name: 'seo', title: 'SEO & Social' },
    { name: 'quiz', title: 'Quiz' },
  ],
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      title: 'Title',
      group: 'content',
      validation: (Rule) => Rule.required().max(100),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      group: 'meta',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      title: 'Description',
      group: 'seo',
      rows: 3,
      validation: (Rule) => Rule.required().max(300),
    }),
    defineField({
      name: 'date',
      type: 'datetime',
      title: 'Publication Date',
      group: 'meta',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishDate',
      type: 'datetime',
      title: 'Schedule Publish Date',
      group: 'meta',
      description: 'If set, post will only appear after this date (for future scheduling)',
    }),
    defineField({
      name: 'updatedDate',
      type: 'datetime',
      title: 'Last Updated Date',
      group: 'meta',
    }),
    defineField({
      name: 'author',
      type: 'string',
      title: 'Author',
      group: 'meta',
      initialValue: 'ChampionsPrep',
    }),
    defineField({
      name: 'cluster',
      type: 'string',
      title: 'Cluster',
      group: 'meta',
      options: { list: CLUSTERS },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tags',
      type: 'array',
      title: 'Tags',
      group: 'meta',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'draft',
      type: 'boolean',
      title: 'Draft',
      group: 'meta',
      description: 'Drafts are not shown on the public site',
      initialValue: true,
    }),
    defineField({
      name: 'minutesRead',
      type: 'number',
      title: 'Minutes to Read',
      group: 'meta',
      description: 'Leave blank to auto-calculate from body word count',
    }),
    defineField({
      name: 'ogImage',
      type: 'string',
      title: 'OG Image Path',
      group: 'seo',
      description: 'Custom OG image path (e.g. /blog/og/my-post.png). Leave blank for auto-generated.',
    }),
    defineField({
      name: 'body',
      type: 'markdown',
      title: 'Body (Markdown)',
      group: 'content',
      description: 'Write content in Markdown. LaTeX math supported with $...$ and $$...$$.',
    }),
    defineField({
      name: 'faqItems',
      type: 'array',
      title: 'FAQ Items',
      group: 'seo',
      description: 'Adds FAQ schema markup and a Q&A section',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          title: 'FAQ Item',
          fields: [
            defineField({ name: 'q', type: 'string', title: 'Question', validation: (Rule) => Rule.required() }),
            defineField({ name: 'a', type: 'text', title: 'Answer', rows: 3, validation: (Rule) => Rule.required() }),
          ],
          preview: {
            select: { title: 'q' },
          },
        },
      ],
    }),
    defineField({
      name: 'quiz',
      type: 'object',
      title: 'Inline Quiz',
      group: 'quiz',
      description: 'Attach a quiz to this post (max 7 questions)',
      fields: [
        defineField({ name: 'title', type: 'string', title: 'Quiz Title' }),
        defineField({
          name: 'mode',
          type: 'string',
          title: 'Mode',
          options: {
            list: [
              { title: 'Practice (show answers immediately)', value: 'practice' },
              { title: 'Exam (show answers at end)', value: 'exam' },
            ],
            layout: 'radio',
          },
          initialValue: 'practice',
        }),
        defineField({
          name: 'timeLimit',
          type: 'number',
          title: 'Time Limit (seconds)',
          description: 'Leave blank for no time limit',
        }),
        defineField({
          name: 'questions',
          type: 'array',
          title: 'Questions',
          validation: (Rule) => Rule.max(7),
          of: [
            {
              type: 'object',
              name: 'quizQuestion',
              title: 'Question',
              fields: [
                defineField({ name: 'question', type: 'string', title: 'Question', validation: (Rule) => Rule.required() }),
                defineField({
                  name: 'options',
                  type: 'array',
                  title: 'Options',
                  of: [{ type: 'string' }],
                  validation: (Rule) => Rule.required().min(2),
                }),
                defineField({
                  name: 'correctIndex',
                  type: 'number',
                  title: 'Correct Option (0-based index)',
                  description: '0 = first option, 1 = second option, etc.',
                  validation: (Rule) => Rule.required().integer().min(0),
                }),
                defineField({ name: 'explanation', type: 'text', title: 'Explanation', rows: 2 }),
              ],
              preview: {
                select: { title: 'question' },
              },
            },
          ],
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'cluster',
      draft: 'draft',
    },
    prepare({ title, subtitle, draft }) {
      const clusterLabel = subtitle
        ? subtitle.split('-').map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ')
        : 'No cluster'
      return {
        title: `${draft ? '[DRAFT] ' : ''}${title ?? 'Untitled'}`,
        subtitle: clusterLabel,
      }
    },
  },
})
