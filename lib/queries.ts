import { groq } from 'next-sanity'

export const blogListQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) {
    _id, title, slug, excerpt, tags, author, publishedAt, bgGradient,
    coverImage { asset->{ url }, alt }
  }
`

export const latestPostsQuery = groq`
  *[_type == "blogPost"] | order(publishedAt desc) [0...3] {
    _id, title, slug, excerpt, tags, author, publishedAt, bgGradient,
    coverImage { asset->{ url }, alt }
  }
`

export const blogPostQuery = groq`
  *[_type == "blogPost" && slug.current == $slug][0] {
    _id, _updatedAt, title, slug, excerpt, content, tags, author, publishedAt, bgGradient,
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
    ticker, heroBadge, heroTitle, heroSub,
    heroImage { asset->{ url }, alt },
    operatorCount, growthOpsCount, brandCount, nmv,
    aboutTitle, aboutBody,
    aboutImage { asset->{ url }, alt },
    servicesIntro, services,
    faqIntro, faq,
    cta,
    footerText, socialLinks
  }
`

export const teamQuery = groq`
  *[_type == "teamMember"] | order(order asc) {
    _id, name, role, isLead, avatar { asset->{ url } }
  }
`

export const brandsQuery = groq`
  *[_type == "brand" && active != false] | order(category asc, order asc) {
    _id, name, category,
    "logoUrl": logo.asset->url
  }
`

export const caseStudiesQuery = groq`
  *[_type == "caseStudy"] | order(featured desc, order asc, publishedAt desc) {
    _id, title, slug, brandName, industry, platforms,
    excerpt, featured, publishedAt, tags,
    "coverUrl": coverImage.asset->url,
    "logoUrl": logoImage.asset->url,
    "results": results[0..2]
  }
`

export const featuredCaseStudiesQuery = groq`
  *[_type == "caseStudy" && featured == true] | order(order asc)[0...3] {
    _id, title, slug, brandName, industry, platforms,
    excerpt, "coverUrl": coverImage.asset->url, "logoUrl": logoImage.asset->url,
    "topResult": results[0]
  }
`

export const caseStudyBySlugQuery = groq`
  *[_type == "caseStudy" && slug.current == $slug][0] {
    _id, title, slug, brandName, industry, platforms,
    periodStart, periodEnd,
    "coverUrl": coverImage.asset->url,
    "logoUrl": logoImage.asset->url,
    excerpt, challenge, solution, results,
    testimonial { quote, authorName, authorRole, "authorPhotoUrl": authorPhoto.asset->url },
    "galleryUrls": gallery[].asset->url,
    tags, publishedAt, _updatedAt
  }
`

export const caseStudySlugsQuery = groq`
  *[_type == "caseStudy" && defined(slug.current)] { "slug": slug.current }
`

export const relatedCaseStudiesQuery = groq`
  *[_type == "caseStudy" && industry == $industry && slug.current != $slug] | order(featured desc, order asc)[0...3] {
    _id, title, slug, brandName, industry, excerpt,
    "coverUrl": coverImage.asset->url,
    "logoUrl": logoImage.asset->url
  }
`
