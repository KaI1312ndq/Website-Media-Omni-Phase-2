import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'placeholder'
const dataset   = process.env.NEXT_PUBLIC_SANITY_DATASET   ?? 'production'

export const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  // useCdn:false → fresh data sau avatar/CMS write. Next.js ISR (revalidate=3600) vẫn cache layer trước.
  useCdn: false,
})

const builder = imageUrlBuilder(client)
export const urlFor = (source: SanityImageSource) => builder.image(source)
