'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET!

// Singleton document types (only one instance allowed)
const SINGLETONS = ['siteSettings']

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'Media Omni CMS',
  schema: {
    types: schemaTypes,
    // Hide singletons from "create new" templates
    templates: templates => templates.filter(({ schemaType }) => !SINGLETONS.includes(schemaType)),
  },
  document: {
    // Block "create" + "duplicate" actions on singletons
    actions: (input, { schemaType }) =>
      SINGLETONS.includes(schemaType)
        ? input.filter(({ action }) => action !== 'duplicate' && action !== 'unpublish' && action !== 'delete')
        : input,
  },
  plugins: [
    structureTool({
      structure: S =>
        S.list()
          .title('Media Omni CMS')
          .items([
            // SITE
            S.listItem()
              .title('Site')
              .icon(() => '🌐')
              .child(
                S.list()
                  .title('Site')
                  .items([
                    S.listItem()
                      .title('Site Settings')
                      .icon(() => '⚙️')
                      .child(
                        S.document().schemaType('siteSettings').documentId('siteSettings')
                      ),
                  ])
              ),
            S.divider(),
            // CONTENT
            S.listItem()
              .title('Content')
              .icon(() => '📚')
              .child(
                S.list()
                  .title('Content')
                  .items([
                    S.listItem()
                      .title('Blog Posts')
                      .icon(() => '📝')
                      .child(
                        S.documentList()
                          .title('Blog Posts')
                          .filter('_type == "blogPost"')
                          .defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
                      ),
                    S.listItem()
                      .title('Case Studies')
                      .icon(() => '🎯')
                      .child(
                        S.documentList()
                          .title('Case Studies')
                          .filter('_type == "caseStudy"')
                          .defaultOrdering([{ field: 'featured', direction: 'desc' }, { field: 'order', direction: 'asc' }])
                      ),
                  ])
              ),
            // PEOPLE
            S.listItem()
              .title('People')
              .icon(() => '👥')
              .child(
                S.documentList()
                  .title('Team Members')
                  .filter('_type == "teamMember"')
                  .defaultOrdering([{ field: 'order', direction: 'asc' }])
              ),
            // BRANDS
            S.listItem()
              .title('Brands')
              .icon(() => '🏷️')
              .child(
                S.documentList()
                  .title('Brand Portfolio')
                  .filter('_type == "brand"')
                  .defaultOrdering([{ field: 'category', direction: 'asc' }, { field: 'order', direction: 'asc' }])
              ),
            S.divider(),
            // RESOURCES
            S.listItem()
              .title('Resources')
              .icon(() => '📚')
              .child(
                S.list()
                  .title('Resources')
                  .items([
                    S.listItem()
                      .title('SOP & Docs')
                      .icon(() => '📋')
                      .child(
                        S.documentList()
                          .title('SOP & Resources')
                          .filter('_type == "sopDoc"')
                          .defaultOrdering([
                            { field: 'pinned', direction: 'desc' },
                            { field: 'order', direction: 'asc' },
                          ])
                      ),
                  ])
              ),
          ]),
    }),
    visionTool(),
  ],
})
