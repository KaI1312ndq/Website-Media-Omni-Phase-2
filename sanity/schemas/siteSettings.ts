import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero', default: true },
    { name: 'about', title: 'About' },
    { name: 'services', title: 'Services' },
    { name: 'faq', title: 'FAQ' },
    { name: 'cta', title: 'CTA' },
    { name: 'footer', title: 'Footer' },
  ],
  fields: [
    // Hero ticker stats
    defineField({
      name: 'ticker', title: 'Ticker Stats', type: 'array',
      group: 'hero',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          { name: 'val', title: 'Số liệu', type: 'string' },
          { name: 'lbl', title: 'Label', type: 'string' },
          { name: 'sub', title: 'Sub-label', type: 'string' },
        ],
        preview: { select: { title: 'val', subtitle: 'lbl' } },
      })],
    }),
    // Hero section
    defineField({ name: 'heroBadge', title: 'Hero Badge', type: 'string', group: 'hero', initialValue: 'UpBase Vietnam · Ecommerce Enabler' }),
    defineField({ name: 'heroTitle', title: 'Hero Title', type: 'string', group: 'hero', initialValue: 'Media Omni Dream Team 2025.' }),
    defineField({ name: 'heroSub', title: 'Hero Subtitle', type: 'text', rows: 2, group: 'hero' }),
    // Key metrics (displayed in hero)
    defineField({ name: 'operatorCount', title: 'Số Growth Operators', type: 'number', group: 'hero', initialValue: 12 }),
    defineField({ name: 'brandCount', title: 'Số Brands', type: 'string', group: 'hero', initialValue: '100+' }),
    defineField({ name: 'nmv', title: 'NMV', type: 'string', group: 'hero', initialValue: '356B' }),

    // About
    defineField({ name: 'aboutTitle', title: 'About Title', type: 'string', group: 'about' }),
    defineField({ name: 'aboutBody', title: 'About Body', type: 'text', rows: 4, group: 'about' }),

    // Services
    defineField({
      name: 'services', title: 'Services', type: 'array', group: 'services',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          { name: 'name', title: 'Name', type: 'string' },
          { name: 'desc', title: 'Description', type: 'text', rows: 2 },
          { name: 'icon', title: 'Icon (emoji or lucide name)', type: 'string' },
          { name: 'platform', title: 'Platform', type: 'string',
            options: { list: ['tiktok', 'shopee', 'meta', 'google', 'other'] } },
        ],
        preview: { select: { title: 'name', subtitle: 'platform' } },
      })],
    }),

    // FAQ
    defineField({
      name: 'faq', title: 'FAQ', type: 'array', group: 'faq',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          { name: 'question', title: 'Question', type: 'string' },
          { name: 'answer', title: 'Answer', type: 'text', rows: 3 },
        ],
        preview: { select: { title: 'question' } },
      })],
    }),

    // CTA
    defineField({
      name: 'cta', title: 'CTA Block', type: 'object', group: 'cta',
      fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'body', title: 'Body', type: 'text', rows: 2 },
        { name: 'buttonText', title: 'Button Text', type: 'string' },
        { name: 'buttonUrl', title: 'Button URL', type: 'string' },
      ],
    }),

    // Footer
    defineField({ name: 'footerText', title: 'Footer Text', type: 'text', rows: 2, group: 'footer' }),
    defineField({
      name: 'socialLinks', title: 'Social Links', type: 'array', group: 'footer',
      of: [defineArrayMember({
        type: 'object',
        fields: [
          { name: 'platform', title: 'Platform', type: 'string' },
          { name: 'url', title: 'URL', type: 'url' },
        ],
        preview: { select: { title: 'platform', subtitle: 'url' } },
      })],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
