import { client } from '@/lib/sanity'
import { sopListQuery } from '@/lib/queries'
import SopHubClient from '@/components/SopHubClient'
import './sop.css'

export const revalidate = 300
export const metadata = { title: 'SOP & Resources — Media Omni Hub' }

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

export default async function SopHubPage() {
  const docs = hasSanity
    ? await client.fetch(sopListQuery).catch(() => [])
    : []
  return <SopHubClient docs={docs || []} />
}
