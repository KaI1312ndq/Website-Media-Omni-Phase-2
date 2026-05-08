import { client } from '@/lib/sanity'
import { siteSettingsQuery, teamQuery, blogListQuery } from '@/lib/queries'
import HomeClient from '@/components/HomeClient'

// ISR: regenerate every hour. Falls back to empty data when Sanity env not set.
export const revalidate = 3600

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

export default async function HomePage() {
  const [settings, team, posts] = hasSanity
    ? await Promise.all([
        client.fetch(siteSettingsQuery).catch(() => null),
        client.fetch(teamQuery).catch(() => []),
        client.fetch(blogListQuery).catch(() => []),
      ])
    : [null, [], []]

  return <HomeClient settings={settings} team={team} posts={(posts as unknown[]).slice(0, 3) as Parameters<typeof HomeClient>[0]['posts']} />
}
