'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Media Omni CMS',
  schema: { types: schemaTypes },
  plugins: [
    structureTool({
      structure: S =>
        S.list()
          .title('Media Omni CMS')
          .items([
            S.listItem().title('📝 Blog Posts').child(
              S.documentList().title('Blog Posts').filter('_type == "blogPost"').defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
            ),
            S.listItem().title('⚙️ Site Settings').child(
              S.document().schemaType('siteSettings').documentId('siteSettings')
            ),
            S.listItem().title('👥 Team Members').child(
              S.documentList().title('Team').filter('_type == "teamMember"').defaultOrdering([{ field: 'order', direction: 'asc' }])
            ),
          ]),
    }),
    visionTool(),
  ],
})
