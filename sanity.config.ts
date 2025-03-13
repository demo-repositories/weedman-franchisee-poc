import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {franchiseeOwnerSchemaTypes, globalAdminSchemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent, Role} from 'sanity'
import {createClient} from '@sanity/client'

const franchisees = [
  {
    name: 'weedman-austin',
    title: 'Weedman Austin',
  },
  {
    name: 'weedman-toronto',
    title: 'Weedman Toronto',
  }
]

const client = createClient({
  projectId: 'b7tq4qrc',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2023-05-03',
})

const getFranchiseeStructure = (f: any) => async (S: any) => {
  // Fetch the franchisee document by name
  const franchisee = await client.fetch(
    `*[_type == "franchisee" && name == $name][0]`,
    { name: f.name }
  )

  const franchiseeTitle = franchisee.title

  if (!franchisee?._id) {
    return S.list()
      .title(franchiseeTitle)
      .items([
        S.listItem()
          .id("no-store-information")
          .title(`No Store Information found for ${franchiseeTitle}`)
          .icon(() => '⚠️')
          .child(
            S.component()
              .id("no-store-information-component")
              .component(() => {
                return {
                  component: () => (
                    `No Store Information found for ${franchiseeTitle}`
                  ),
                  canHandleIntent: () => false
                }
              })
          )
      ])
  }

  const franchiseeId = franchisee._id
  
  return S.list()
    .id("store-information")
    .title(franchiseeTitle)
    .items([
      S.listItem()
        .title('Store Information')
        .schemaType('franchisee')
        .child(
          S.document().documentId(franchiseeId).schemaType("franchisee")
        )
    ])
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
  {
    name: 'franchisee',
    title: 'Weedman Franchisee',
    projectId: 'b7tq4qrc',
    dataset: 'production',
    basePath: "/franchisee",
    plugins: [structureTool({
      structure: (S, context) => {
        const userRoles = context.currentUser?.roles;

        // Find a role that is not 'franchisee-owner' and not 'admin'
        const otherRole = userRoles?.find((role: Role) => 
          role.name !== 'franchisee-owner' && role.name !== 'administrator'
        );

        if (otherRole || userRoles?.find((role: Role) => role.name === 'franchisee-owner')) {
          return S.documentTypeList('franchisee').title('Store Information').filter(`id == $id`).params({id: otherRole?.name})
        }

        return S.list().title('No Access')
      }
    }), visionTool()],

    schema: {
      types: franchiseeOwnerSchemaTypes,
    },
  },
])