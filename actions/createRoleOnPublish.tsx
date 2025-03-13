import { useState, useEffect } from 'react'
import {useClient} from 'sanity'
import type {DocumentActionDescription, DocumentActionProps} from 'sanity'

const ROLE_CREATOR_API_TOKEN = process.env.SANITY_STUDIO_ROLE_CREATOR_API_TOKEN

export function createRoleOnPublish(props: DocumentActionProps): DocumentActionDescription | undefined {
  const {draft, published, type} = props
  const client = useClient({apiVersion: '2024-03-20'})
  const projectId = client.config().projectId
  const [actionState, setActionState] = useState<'idle' | 'publishing' | 'creating-role'>('idle')

  // Only show this action for franchisee documents
  if (type !== 'franchisee') {
    return undefined
  }

  // Only show this action when the document is being published
  if (published || !draft) {
    return undefined
  }

  return {
    label: actionState === 'creating-role'
      ? 'Creating role...'
      : actionState === 'publishing'
      ? 'Publishing document...'
      : 'Create Role and Publish',
    onHandle: async () => {
      try {
        const slug = draft?.slug
        if (!slug) {
          throw new Error('Slug is missing from the document')
        }

        // First, create the role using the Sanity Management API
        setActionState('creating-role')
        const response = await fetch(`https://api.sanity.io/v2021-06-07/projects/${projectId}/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ROLE_CREATOR_API_TOKEN}`
          },
          body: JSON.stringify({
            // @ts-ignore
            name: draft?.slug?.current,
            title: draft.name,
          })
        })

        if (!response.ok) {
          throw new Error('Failed to create role')
        }

        // Then, publish the document
        setActionState('publishing')
        await client.transaction()
          .createOrReplace({
            ...draft,
            _id: draft._id.replace('drafts.', ''),
            _type: 'franchisee'
          })
          .delete(draft._id)
          .commit()

        setActionState('idle')
        return {
          message: `Successfully created role and published franchisee ${draft.name}`
        }
      } catch (error: unknown) {
        setActionState('idle')
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        return {
          message: `Error: ${errorMessage}`,
          tone: 'critical'
        }
      }
    },
    tone: 'default'
  }
} 