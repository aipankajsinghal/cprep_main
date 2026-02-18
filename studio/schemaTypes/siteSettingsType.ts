import { defineField, defineType } from 'sanity'
import { CogIcon } from '@sanity/icons'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  icon: CogIcon,
  // Singleton — prevent creating multiple instances
  __experimental_actions: ['update', 'publish'],
  fields: [
    defineField({
      name: 'mainSiteUrl',
      type: 'url',
      title: 'Main Site URL',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'aboutUrl',
      type: 'url',
      title: 'About Page URL',
    }),
    defineField({
      name: 'privacyUrl',
      type: 'string',
      title: 'Privacy Policy URL',
    }),
    defineField({
      name: 'termsUrl',
      type: 'string',
      title: 'Terms URL',
    }),
    defineField({
      name: 'instagramUrl',
      type: 'url',
      title: 'Instagram URL',
    }),
    defineField({
      name: 'xUrl',
      type: 'url',
      title: 'X (Twitter) URL',
    }),
    defineField({
      name: 'footerTagline',
      type: 'string',
      title: 'Footer Tagline',
      validation: (Rule) => Rule.max(100),
    }),
  ],
  preview: {
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
