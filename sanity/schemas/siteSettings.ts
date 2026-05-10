import { defineType, defineField, defineArrayMember } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: [
    { name: 'hero', title: 'Hero' },
    { name: 'about', title: 'About' },
    { name: 'services', title: 'Services' },
    { name: 'faq', title: 'FAQ' },
    { name: 'cta', title: 'CTA' },
    { name: 'footer', title: 'Footer' },
    { name: 'internal', title: 'Internal — AI Prompt' },
  ],
  fields: [
    // Hero
    defineField({ name: 'heroBadge', title: 'Hero Badge', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroTitle',
      title: 'Hero Title',
      type: 'string',
      group: 'hero',
      initialValue: 'Vận hành performance marketing đa kênh.',
    }),
    defineField({ name: 'heroSub', title: 'Hero Subtitle', type: 'text', rows: 3, group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Hero Background Image',
      type: 'image',
      options: { hotspot: true },
      group: 'hero',
      fields: [{ name: 'alt', type: 'string', title: 'Alt' }],
    }),

    // Stats
    defineField({
      name: 'operatorCount',
      title: 'Số Growth Operators (number)',
      type: 'number',
      initialValue: 12,
    }),
    defineField({
      name: 'growthOpsCount',
      title: 'Growth Ops Display (string, "12+")',
      type: 'string',
      initialValue: '12',
    }),
    defineField({ name: 'brandCount', title: 'Số Brands', type: 'string', initialValue: '100+' }),
    defineField({ name: 'nmv', title: 'NMV', type: 'string', initialValue: '356B' }),

    // Hero ticker stats
    defineField({
      name: 'ticker',
      title: 'Ticker Stats',
      type: 'array',
      group: 'hero',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'val', title: 'Số liệu', type: 'string' },
            { name: 'lbl', title: 'Label', type: 'string' },
            { name: 'sub', title: 'Sub-label', type: 'string' },
          ],
          preview: { select: { title: 'val', subtitle: 'lbl' } },
        }),
      ],
    }),

    // About
    defineField({ name: 'aboutTitle', title: 'About Title', type: 'string', group: 'about' }),
    defineField({ name: 'aboutBody', title: 'About Body', type: 'text', rows: 4, group: 'about' }),
    defineField({
      name: 'aboutImage',
      title: 'About Image',
      type: 'image',
      options: { hotspot: true },
      group: 'about',
      fields: [{ name: 'alt', type: 'string', title: 'Alt' }],
    }),

    // Services
    defineField({ name: 'servicesIntro', title: 'Services Intro', type: 'text', rows: 2, group: 'services' }),
    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      group: 'services',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'name', title: 'Tên', type: 'string' },
            { name: 'desc', title: 'Mô tả', type: 'text', rows: 2 },
            { name: 'icon', title: 'Icon (emoji or short)', type: 'string' },
          ],
          preview: { select: { title: 'name', subtitle: 'desc', media: 'icon' } },
        }),
      ],
    }),

    // FAQ
    defineField({ name: 'faqIntro', title: 'FAQ Intro', type: 'text', rows: 2, group: 'faq' }),
    defineField({
      name: 'faq',
      title: 'FAQ',
      type: 'array',
      group: 'faq',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            { name: 'q', title: 'Question', type: 'string' },
            { name: 'a', title: 'Answer', type: 'text', rows: 3 },
          ],
          preview: { select: { title: 'q', subtitle: 'a' } },
        }),
      ],
    }),

    // CTA
    defineField({
      name: 'cta',
      title: 'CTA Section',
      type: 'object',
      group: 'cta',
      fields: [
        { name: 'title', title: 'Title', type: 'string' },
        { name: 'body', title: 'Body', type: 'text', rows: 2 },
        { name: 'buttonText', title: 'Button Text', type: 'string' },
        { name: 'buttonUrl', title: 'Button URL', type: 'string' },
      ],
    }),

    // Internal — Weekly Report AI prompt (admin-tunable, falls back to lib/report/ai-prompt.ts)
    defineField({
      name: 'reportAIPrompt',
      title: 'Weekly Report — AI System Prompt',
      description:
        'Prompt cho AI khi tạo báo cáo tuần ở /hub/report. Để trống → dùng default trong lib/report/ai-prompt.ts. Sửa cẩn thận: prompt yêu cầu AI trả về JSON đúng format.',
      type: 'text',
      rows: 30,
      group: 'internal',
    }),

    // Footer
    defineField({ name: 'footerText', title: 'Footer Copyright', type: 'string', group: 'footer' }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      group: 'footer',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            {
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: { list: ['facebook', 'linkedin', 'youtube', 'instagram', 'tiktok'] },
            },
            { name: 'url', title: 'URL', type: 'url' },
          ],
          preview: { select: { title: 'platform', subtitle: 'url' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Site Settings' }) },
})
