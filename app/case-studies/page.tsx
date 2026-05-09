import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { caseStudiesQuery } from '@/lib/queries'
import CaseStudiesClient, { type CaseStudyListItem } from '@/components/CaseStudiesClient'

export const metadata: Metadata = {
  title: 'Case Studies — Real results from real brands',
  description: 'Case studies thực chiến từ Media Omni — cách scale 100+ brands ecommerce trên TikTok Shop, Shopee, Meta, Google với ROAS đo lường được.',
  openGraph: {
    title: 'Case Studies | Media Omni',
    description: 'Cách Media Omni scale brands ecommerce hàng đầu Việt Nam.',
    url: 'https://www.mediaomni.site/case-studies',
  },
}

export const revalidate = 600

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

export default async function CaseStudiesPage() {
  const caseStudies: CaseStudyListItem[] = hasSanity
    ? await client.fetch(caseStudiesQuery).catch(() => [])
    : []
  return <CaseStudiesClient initialCaseStudies={caseStudies} />
}
