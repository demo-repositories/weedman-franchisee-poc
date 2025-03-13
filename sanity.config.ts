import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {franchiseeOwnerSchemaTypes, globalAdminSchemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent} from 'sanity'
import {createClient} from '@sanity/client'

// Create a client for fetching data
const client = createClient({
  projectId: 'b7tq4qrc',
  dataset: 'production',
  apiVersion: '2023-05-03',
})

async function getFranchiseeWorkspaces() {
  const franchisees = await client.fetch(`*[_type == "franchisee"]`)
  if (!franchisees || franchisees.length === 0) {
    return null
  }
  return franchisees.map((franchisee: any) => ({
    name: franchisee.name,
    title: franchisee.name,
    basePath: `/${franchisee.slug.current}`,
    projectId: 'b7tq4qrc',
    dataset: 'production',
    plugins: [structureTool(), visionTool()],
    schema: {
      types: franchiseeOwnerSchemaTypes,
    },
  }))
}

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
  ...(await getFranchiseeWorkspaces())
])
