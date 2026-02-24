import { defineField, defineType } from 'sanity'
import { InfoOutlineIcon, UsersIcon, StarIcon, CreditCardIcon } from '@sanity/icons'

export const faqType = defineType({
  name: 'faq',
  title: 'FAQ',
  type: 'document',
  icon: InfoOutlineIcon,
  fields: [
    defineField({ name: 'question', type: 'string', title: 'Question' }),
    defineField({ name: 'answer', type: 'text', title: 'Answer', rows: 3 }),
    defineField({ name: 'order', type: 'number', title: 'Display Order' }),
  ],
})

export const testimonialType = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  icon: UsersIcon,
  fields: [
    defineField({ name: 'author', type: 'string', title: 'Author' }),
    defineField({ name: 'role', type: 'string', title: 'Role' }),
    defineField({ name: 'content', type: 'text', title: 'Content' }),
    defineField({ name: 'rating', type: 'number', title: 'Rating', validation: Rule => Rule.min(1).max(5) }),
    defineField({ name: 'image', type: 'image', title: 'Author Image' }),
  ],
})

export const featureType = defineType({
    name: 'feature',
    title: 'Feature',
    type: 'document',
    icon: StarIcon,
    fields: [
      defineField({ name: 'title', type: 'string', title: 'Title' }),
      defineField({ name: 'description', type: 'text', title: 'Description' }),
      defineField({ name: 'icon', type: 'string', title: 'Icon Name' }),
    ],
  })

export const pricingPlanType = defineType({
  name: 'pricingPlan',
  title: 'Pricing Plan',
  type: 'document',
  icon: CreditCardIcon,
  fields: [
    defineField({ name: 'name', type: 'string', title: 'Plan Name' }),
    defineField({ name: 'price', type: 'number', title: 'Price' }),
    defineField({ name: 'description', type: 'string', title: 'Description' }),
    defineField({ name: 'features', type: 'array', title: 'Features', of: [{ type: 'string' }] }),
    defineField({ name: 'highlighted', type: 'boolean', title: 'Highlighted', initialValue: false }),
    defineField({ name: 'order', type: 'number', title: 'Display Order' }),
  ],
})
