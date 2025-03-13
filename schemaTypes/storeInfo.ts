import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'storeInfo',
  title: 'Store Information',
  type: 'document',
  fields: [
    defineField({
      name: 'phoneNumber',
      title: 'Phone Number',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
})
