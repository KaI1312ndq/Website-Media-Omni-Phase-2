import { defineType, defineField } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  icon: () => '📝',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'string', validation: R => R.required() }),
    defineField({
      name: 'slug', title: 'Slug (URL)', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: R => R.required(),
    }),
    defineField({ name: 'excerpt', title: 'Mô tả ngắn', type: 'text', rows: 3, validation: R => R.required() }),
    defineField({
      name: 'content', title: 'Nội dung', type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              { name: 'link', type: 'object', title: 'Link', fields: [
                { name: 'href', type: 'url', title: 'URL' },
                { name: 'blank', type: 'boolean', title: 'Mở tab mới', initialValue: true },
              ]},
            ],
          },
        },
        { type: 'image', options: { hotspot: true }, fields: [
          { name: 'alt', type: 'string', title: 'Alt text' },
          { name: 'caption', type: 'string', title: 'Caption' },
        ]},
      ],
    }),
    defineField({
      name: 'coverImage', title: 'Ảnh bìa (tuỳ chọn)', type: 'image',
      options: { hotspot: true },
      fields: [{ name: 'alt', type: 'string', title: 'Alt text' }],
    }),
    defineField({
      name: 'bgGradient',
      title: 'Màu nền thumbnail',
      type: 'string',
      initialValue: 'navy',
      description: 'Chọn màu nền — hiển thị khi không có ảnh bìa',
      options: {
        list: [
          { title: '🟦 Navy (mặc định)',   value: 'navy'   },
          { title: '🔵 Blue',              value: 'blue'   },
          { title: '🩵 Teal',              value: 'teal'   },
          { title: '🟣 Purple',            value: 'purple' },
          { title: '🟠 Orange',            value: 'orange' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'tags', title: 'Tags', type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
    }),
    defineField({ name: 'author', title: 'Tác giả', type: 'string', initialValue: 'Nguyễn Đức Quảng' }),
    defineField({ name: 'publishedAt', title: 'Ngày đăng', type: 'datetime', initialValue: () => new Date().toISOString() }),
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO Title', type: 'string', description: 'Để trống → dùng tiêu đề bài viết' }),
    defineField({ name: 'seoDescription', title: 'SEO Description', type: 'text', rows: 2, description: 'Để trống → dùng excerpt' }),
    defineField({ name: 'ogImage', title: 'OG Image', type: 'image', description: 'Ảnh khi share lên Facebook/Zalo. 1200×630px.' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'coverImage' },
    prepare({ title, subtitle }) {
      return { title, subtitle: subtitle ? new Date(subtitle).toLocaleDateString('vi-VN') : 'Draft' }
    },
  },
  orderings: [{ title: 'Mới nhất', name: 'publishedAtDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
})
