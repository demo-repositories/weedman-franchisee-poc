import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'franchisee',
  title: 'Franchisee',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
        name: 'phoneNumber',
        title: 'Phone Number',
        type: 'string',
      }),
  ],
})
