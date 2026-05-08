import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    // Hero ticker stats
    defineField({
      name: 'ticker', title: 'Ticker Stats', type: 'array',
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
    defineField({ name: 'heroTitle', title: 'Hero Title', type: 'string', initialValue: 'Media Omni Dream Team 2025.' }),
    defineField({ name: 'heroSub', title: 'Hero Subtitle', type: 'text', rows: 2 }),
    // Key metrics (displayed in hero)
    defineField({ name: 'operatorCount', title: 'Số Growth Operators', type: 'number', initialValue: 12 }),
    defineField({ name: 'brandCount', title: 'Số Brands', type: 'string', initialValue: '100+' }),
    defineField({ name: 'nmv', title: 'NMV', type: 'string', initialValue: '356B' }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
