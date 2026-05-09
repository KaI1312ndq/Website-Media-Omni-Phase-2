import { defineType, defineField } from 'sanity'

export const brand = defineType({
  name: 'brand',
  title: 'Brand Portfolio',
  type: 'document',
  icon: () => '🏷️',
  fields: [
    defineField({
      name: 'name',
      title: 'Tên Brand',
      type: 'string',
      validation: R => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Danh mục',
      type: 'string',
      options: {
        list: [
          { title: '🧴 Skincare & Beauty', value: 'skincare' },
          { title: '👗 Fashion & Lifestyle', value: 'fashion' },
          { title: '🍼 Baby & Kids',         value: 'baby' },
          { title: '🛒 FMCG & Food',         value: 'fmcg' },
          { title: '🔌 Electronics & Home',  value: 'electronics' },
        ],
        layout: 'radio',
      },
      validation: R => R.required(),
    }),
    defineField({
      name: 'active',
      title: 'Hiển thị trên website',
      type: 'boolean',
      initialValue: true,
      description: 'Tắt để ẩn brand khỏi homepage mà không cần xoá',
    }),
    defineField({
      name: 'order',
      title: 'Thứ tự (trong danh mục)',
      type: 'number',
      initialValue: 99,
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'category', active: 'active' },
    prepare(selection: Record<string, unknown>) {
      const { title, subtitle, active } = selection as { title: string; subtitle: string; active: boolean }
      const icons: Record<string, string> = {
        skincare: '🧴', fashion: '👗', baby: '🍼', fmcg: '🛒', electronics: '🔌',
      }
      return {
        title: `${active === false ? '🔴 ' : ''}${title}`,
        subtitle: `${icons[subtitle] ?? '📦'} ${subtitle ?? 'Chưa chọn danh mục'}`,
      }
    },
  },
  orderings: [
    {
      title: 'Theo danh mục + thứ tự',
      name: 'categoryOrder',
      by: [{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }],
    },
  ],
})
