import type { Metadata } from 'next'
import { client } from '@/lib/sanity'
import { blogListQuery } from '@/lib/queries'
import BlogListClient from '@/components/BlogListClient'

export const metadata: Metadata = {
  title: 'Blog & Insights',
  description: 'Case study, framework và playbook thực chiến từ đội ngũ Media Omni — TikTok Shop, Shopee, Meta, Google Ads.',
  openGraph: {
    title: 'Blog & Insights | Media Omni',
    description: 'Case study, framework và playbook thực chiến từ đội ngũ Media Omni.',
    url: 'https://mediaomni.site/blog',
  },
}

export const revalidate = 600

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

export default async function BlogPage() {
  const posts = hasSanity
    ? await client.fetch(blogListQuery).catch(() => [])
    : []
  return <BlogListClient initialPosts={posts} />
}
