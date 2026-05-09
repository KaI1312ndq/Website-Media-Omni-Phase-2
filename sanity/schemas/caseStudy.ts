import { defineType, defineField } from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  icon: () => '🎯',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'string', validation: R => R.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: R => R.required(),
    }),
    defineField({ name: 'brandName', title: 'Tên Brand', type: 'string', validation: R => R.required() }),
    defineField({
      name: 'industry', title: 'Ngành hàng', type: 'string',
      options: {
        list: [
          { title: 'Skincare & Beauty', value: 'skincare' },
          { title: 'Fashion & Lifestyle', value: 'fashion' },
          { title: 'Baby & Kids', value: 'baby' },
          { title: 'FMCG & Food', value: 'fmcg' },
          { title: 'Electronics & Home', value: 'electronics' },
          { title: 'Health & Pharma', value: 'pharma' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'platforms', title: 'Platforms vận hành', type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Shopee', value: 'shopee' },
          { title: 'TikTok', value: 'tiktok' },
          { title: 'Meta', value: 'meta' },
          { title: 'Google', value: 'google' },
          { title: 'Livestream', value: 'livestream' },
        ],
      },
    }),
    defineField({ name: 'periodStart', title: 'Bắt đầu', type: 'date' }),
    defineField({ name: 'periodEnd', title: 'Kết thúc', type: 'date' }),
    defineField({ name: 'coverImage', title: 'Ảnh cover', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'logoImage', title: 'Logo brand', type: 'image' }),
    defineField({ name: 'excerpt', title: 'Mô tả ngắn (TL;DR)', type: 'text', rows: 3, validation: R => R.required() }),
    defineField({ name: 'challenge', title: 'Vấn đề / Bài toán', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'solution', title: 'Giải pháp / Approach', type: 'array', of: [{ type: 'block' }] }),
    defineField({
      name: 'results', title: 'Kết quả', type: 'array',
      of: [{
        type: 'object',
        name: 'resultItem',
        fields: [
          { name: 'metric', title: 'Chỉ số', type: 'string' },
          { name: 'before', title: 'Trước', type: 'string' },
          { name: 'after', title: 'Sau', type: 'string' },
          { name: 'change', title: 'Δ (% hoặc số tuyệt đối)', type: 'string' },
        ],
        preview: { select: { title: 'metric', subtitle: 'change' } },
      }],
    }),
    defineField({
      name: 'testimonial', title: 'Quote khách hàng', type: 'object',
      fields: [
        { name: 'quote', title: 'Quote', type: 'text', rows: 3 },
        { name: 'authorName', title: 'Tên người nói', type: 'string' },
        { name: 'authorRole', title: 'Chức vụ', type: 'string' },
        { name: 'authorPhoto', title: 'Ảnh đại diện', type: 'image' },
      ],
    }),
    defineField({
      name: 'gallery', title: 'Gallery / Screenshots', type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'tags', title: 'Tags', type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'featured', title: 'Featured (hiện trên homepage)', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 99 }),
    defineField({ name: 'publishedAt', title: 'Ngày xuất bản', type: 'datetime', initialValue: () => new Date().toISOString() }),
  ],
  orderings: [
    { title: 'Featured first', name: 'featuredOrder', by: [{ field: 'featured', direction: 'desc' }, { field: 'order', direction: 'asc' }] },
    { title: 'Mới nhất', name: 'recent', by: [{ field: 'publishedAt', direction: 'desc' }] },
  ],
  preview: {
    select: { title: 'title', subtitle: 'brandName', media: 'coverImage', featured: 'featured' },
    prepare({ title, subtitle, media, featured }) {
      return { title: `${featured ? '⭐ ' : ''}${title}`, subtitle, media }
    },
  },
})
