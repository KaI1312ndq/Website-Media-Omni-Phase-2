import { client } from '@/lib/sanity'
import { siteSettingsQuery, teamQuery, brandsQuery, latestPostsQuery, featuredCaseStudiesQuery } from '@/lib/queries'
import HomeClient from '@/components/HomeClient'

// ISR: regenerate every hour. On-demand revalidation via /api/revalidate
export const revalidate = 3600

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

export default async function HomePage() {
  const [settings, team, brands, posts, featuredCaseStudies] = hasSanity
    ? await Promise.all([
        client.fetch(siteSettingsQuery).catch(() => null),
        client.fetch(teamQuery).catch(() => []),
        client.fetch(brandsQuery).catch(() => []),
        client.fetch(latestPostsQuery).catch(() => []),
        client.fetch(featuredCaseStudiesQuery).catch(() => []),
      ])
    : [null, [], [], [], []]

  return (
    <HomeClient
      settings={settings}
      team={team as Parameters<typeof HomeClient>[0]['team']}
      brands={brands as Parameters<typeof HomeClient>[0]['brands']}
      posts={posts as Parameters<typeof HomeClient>[0]['posts']}
      caseStudies={featuredCaseStudies as Parameters<typeof HomeClient>[0]['caseStudies']}
    />
  )
}
