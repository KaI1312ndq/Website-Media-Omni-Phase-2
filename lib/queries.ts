import { groq } from 'next-sanity'

export const blogListQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, tags, author, publishedAt, bgGradient,
    coverImage { asset->{ url }, alt }
  }
`

export const blogPostQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, title, slug, excerpt, content, tags, author, publishedAt, bgGradient,
    coverImage { asset->{ url }, alt },
    seoTitle, seoDescription,
    ogImage { asset->{ url } }
  }
`

export const blogSlugsQuery = groq`
  *[_type == "blogPost"] { "slug": slug.current }
`

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0] {
    ticker, heroTitle, heroSub, operatorCount, brandCount, nmv
  }
`

export const teamQuery = groq`
  *[_type == "teamMember"] | order(order asc) {
    _id, name, role, isLead, avatar { asset->{ url } }
  }
`

export const brandsQuery = groq`
  *[_type == "brand" && active != false] | order(category asc, order asc) {
    _id, name, category
  }
`
