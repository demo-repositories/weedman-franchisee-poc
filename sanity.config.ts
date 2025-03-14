import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {franchiseeOwnerSchemaTypes, globalAdminSchemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent, Role} from 'sanity'

const PROJECT_ID = 'b7tq4qrc'

export default defineConfig([
  {
    name: 'default',
    title: 'Weedman Global Admin',
    projectId: PROJECT_ID,
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
    projectId: PROJECT_ID,
    dataset: 'production',
    basePath: "/franchisee",
    plugins: [structureTool({
      structure: async (S, context) => {
        const userRoles = context.currentUser?.roles;
        const {getClient} = context;
        const client = getClient({apiVersion: '2023-01-01'});

        // Find a role that is not 'franchisee-owner' and not 'admin'
        const otherRole = userRoles?.find((role: Role) => 
          role.name !== 'franchisee-owner' && role.name !== 'administrator'
        );

        const franchisee = await client.fetch("*[_type == 'franchisee' && id == $id][0]", {id: otherRole?.name})

        if (otherRole || userRoles?.find((role: Role) => role.name === 'franchisee-owner')) {
          return S.list().id("franchisee").title("Your Store").items([
            S.listItem().id("store-info").title("Store Information").child(
              S.document().id(franchisee._id).schemaType("franchisee")
            )
          ])
        }

        return S.list().title('No Access')
      }
    }), visionTool()],

    schema: {
      types: franchiseeOwnerSchemaTypes,
    },

    
  },
])