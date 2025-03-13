import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent} from 'sanity'

export default defineConfig({
  name: 'default',
  title: 'weedman-franchisee-poc',

  projectId: 'b7tq4qrc',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    actions: (prev: DocumentActionComponent[], context) => {
      if (context.schemaType === 'franchisee') {
        return [
          createRoleOnPublish as unknown as DocumentActionComponent,
          ...prev.filter(action => action.name !== 'publish')
        ]
      }
      return prev
    }
  }
})
