import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {franchiseeOwnerSchemaTypes, globalAdminSchemaTypes} from './schemaTypes'
import {createRoleOnPublish} from './actions/createRoleOnPublish'
import type {DocumentActionComponent, Role} from 'sanity'
import { getRoleData } from './utils'

const PROJECT_ID = 'b7tq4qrc'
const STUDIO_TYPE = process.env.SANITY_STUDIO_TYPE

const franchiseeConfig = {
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
        role.name !== 'administrator'
      );

      if(!otherRole) {
        return S.list().title('No Access')
      }

      const [location, membershipType] = getRoleData(otherRole as Role);

      if(!location || !membershipType) {
        return S.list().title('No Access')
      }

      if(membershipType !== 'owner') {
        return S.list().title('No Access')
      }

      // Fetch franchisee where the location from the role matches the name (converted to slug format)
      const franchisee = await client.fetch(
        "*[_type == 'franchisee' && lower(name) match $locationPattern][0]", 
        {locationPattern: location.replace(/_/g, ' ')}
      );

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
}

const adminConfig = {
  name: 'default',
  title: 'Weedman Global Admin',
  projectId: PROJECT_ID,
  dataset: 'production',
  basePath: "/admin",
  plugins: [structureTool({
    structure: (S, context) => {
      const userRoles = context.currentUser?.roles || [];
      const isAdmin = userRoles.some((role) => role.name === 'administrator');
      
      if (!isAdmin) {
        return S.component(() => "No Access").id("no-access");
      }
      
      return S.defaults()
    }
  }), visionTool()],

  schema: {
    types: globalAdminSchemaTypes,
  },

  document: {
    // @ts-ignore
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
}

export default defineConfig(
  STUDIO_TYPE === "administrator" 
    ? [adminConfig, franchiseeConfig] 
    : [franchiseeConfig]
)