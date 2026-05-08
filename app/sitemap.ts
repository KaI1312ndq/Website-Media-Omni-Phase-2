import { MetadataRoute } from 'next'

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

async function getBlogSlugs(): Promise<string[]> {
  if (!hasSanity) return []
  try {
    const { client } = await import('@/lib/sanity')
    const slugs = await client.fetch<{ slug: { current: string }; _updatedAt: string }[]>(
      `*[_type == "post" && defined(slug.current)]{ slug, _updatedAt }`
    )
    return slugs.map(s => s.slug.current)
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://www.mediaomni.site'
  const now  = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base,        lastModified: now, changeFrequency: 'weekly',  priority: 1 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ]

  const slugs = await getBlogSlugs()
  const blogRoutes: MetadataRoute.Sitemap = slugs.map(slug => ({
    url: `${base}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...staticRoutes, ...blogRoutes]
}
