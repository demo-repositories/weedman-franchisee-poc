import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {franchiseeOwnerSchemaTypes, globalAdminSchemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent} from 'sanity'

export default defineConfig([
  {
    name: 'default',
    title: 'Weedman Global Admin',
    projectId: 'b7tq4qrc',
    dataset: 'production',
    basePath: "/admin",
    plugins: [structureTool(), visionTool()],

    schema: {
      types: globalAdminSchemaTypes,
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
    },
  },
  {
    name: 'austin-franchisee',
    title: 'Austin',
    projectId: 'b7tq4qrc',
    dataset: 'production',
    basePath: "/auston",
    plugins: [structureTool(), visionTool()],

    schema: {
      types: franchiseeOwnerSchemaTypes,
    },
  }
])