import { defineType, defineField } from 'sanity'

export const sopDoc = defineType({
  name: 'sopDoc',
  title: 'SOP & Resources',
  type: 'document',
  icon: () => '📚',
  fields: [
    defineField({ name: 'title', title: 'Tiêu đề', type: 'string', validation: R => R.required() }),
    defineField({
      name: 'slug', title: 'Slug', type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: R => R.required(),
    }),
    defineField({
      name: 'category', title: 'Danh mục', type: 'string',
      options: {
        list: [
          { title: 'Quy trình (Process)', value: 'process' },
          { title: 'Templates', value: 'template' },
          { title: 'Checklists', value: 'checklist' },
          { title: 'Training & Onboarding', value: 'training' },
          { title: 'Playbook', value: 'playbook' },
          { title: 'Tools & References', value: 'tools' },
        ],
        layout: 'radio',
      },
      validation: R => R.required(),
    }),
    defineField({
      name: 'platform', title: 'Platform liên quan', type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Shopee', value: 'shopee' },
          { title: 'TikTok', value: 'tiktok' },
          { title: 'Meta', value: 'meta' },
          { title: 'Google', value: 'google' },
          { title: 'General', value: 'general' },
        ],
      },
    }),
    defineField({
      name: 'level', title: 'Cấp độ', type: 'string',
      options: {
        list: [
          { title: 'Beginner', value: 'beginner' },
          { title: 'Intermediate', value: 'intermediate' },
          { title: 'Advanced', value: 'advanced' },
        ],
        layout: 'radio',
      },
      initialValue: 'beginner',
    }),
    defineField({ name: 'excerpt', title: 'Mô tả ngắn', type: 'text', rows: 3, validation: R => R.required() }),
    defineField({ name: 'icon', title: 'Icon (emoji)', type: 'string', initialValue: '📋' }),
    defineField({
      name: 'content', title: 'Nội dung', type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'H4', value: 'h4' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link', type: 'object', title: 'Link',
                fields: [{ name: 'href', title: 'URL', type: 'url' }],
              },
            ],
          },
        },
        {
          type: 'image', options: { hotspot: true },
          fields: [
            { name: 'alt', title: 'Alt text', type: 'string' },
            { name: 'caption', title: 'Caption', type: 'string' },
          ],
        },
        {
          type: 'object', name: 'callout', title: 'Callout',
          fields: [
            {
              name: 'type', title: 'Type', type: 'string',
              options: { list: ['info', 'warning', 'success', 'danger'] },
              initialValue: 'info',
            },
            { name: 'text', title: 'Text', type: 'text', rows: 3 },
          ],
          preview: { select: { title: 'text', subtitle: 'type' } },
        },
        {
          type: 'object', name: 'fileLink', title: 'File / Resource Link',
          fields: [
            { name: 'label', title: 'Label', type: 'string' },
            { name: 'url', title: 'URL', type: 'url' },
            {
              name: 'fileType', title: 'Loại file', type: 'string',
              options: { list: ['pdf', 'xlsx', 'docx', 'figma', 'drive', 'notion', 'sheet', 'other'] },
            },
          ],
          preview: { select: { title: 'label', subtitle: 'fileType' } },
        },
      ],
    }),
    defineField({
      name: 'attachments', title: 'Files đính kèm', type: 'array',
      of: [{ type: 'file' }],
    }),
    defineField({
      name: 'tags', title: 'Tags', type: 'array',
      of: [{ type: 'string' }], options: { layout: 'tags' },
    }),
    defineField({ name: 'pinned', title: 'Pinned (top)', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Thứ tự', type: 'number', initialValue: 99 }),
    defineField({ name: 'author', title: 'Author', type: 'string' }),
    defineField({
      name: 'publishedAt', title: 'Ngày xuất bản', type: 'datetime',
      initialValue: () => new Date().toISOString(),
    }),
  ],
  orderings: [
    {
      title: 'Pinned + Order', name: 'pinnedOrder',
      by: [{ field: 'pinned', direction: 'desc' }, { field: 'order', direction: 'asc' }],
    },
    { title: 'Mới nhất', name: 'recent', by: [{ field: 'publishedAt', direction: 'desc' }] },
    {
      title: 'Theo category', name: 'category',
      by: [{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', icon: 'icon', pinned: 'pinned' },
    prepare({ title, subtitle, icon, pinned }) {
      return {
        title: `${pinned ? '📌 ' : ''}${icon ?? '📋'} ${title}`,
        subtitle: subtitle ?? 'Chưa chọn danh mục',
      }
    },
  },
})
