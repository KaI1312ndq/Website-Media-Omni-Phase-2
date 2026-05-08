import { defineType, defineField } from 'sanity'

export const teamMember = defineType({
  name: 'teamMember',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Họ và tên', type: 'string', validation: R => R.required() }),
    defineField({ name: 'role', title: 'Vai trò', type: 'string', validation: R => R.required() }),
    defineField({ name: 'isLead', title: 'Team Lead?', type: 'boolean', initialValue: false }),
    defineField({ name: 'order', title: 'Thứ tự hiển thị', type: 'number', initialValue: 99 }),
    defineField({ name: 'avatar', title: 'Ảnh đại diện', type: 'image', options: { hotspot: true } }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', isLead: 'isLead' },
    prepare({ title, subtitle, isLead }) {
      return { title: `${isLead ? '★ ' : ''}${title}`, subtitle }
    },
  },
  orderings: [{ title: 'Thứ tự', name: 'order', by: [{ field: 'order', direction: 'asc' }] }],
})
