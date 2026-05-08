import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

// Secret must match the one configured in Sanity webhook
const SECRET = process.env.SANITY_REVALIDATE_SECRET

export async function POST(req: NextRequest) {
  // Verify secret token
  const token = req.nextUrl.searchParams.get('secret')
  if (SECRET && token !== SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const docType: string = body?._type ?? ''
    const slug: string = body?.slug?.current ?? ''

    if (docType === 'blogPost') {
      // Revalidate blog list + the specific post
      revalidatePath('/blog')
      if (slug) revalidatePath(`/blog/${slug}`)
      // Also revalidate homepage (shows 3 latest posts)
      revalidatePath('/')
    } else if (docType === 'siteSettings') {
      revalidatePath('/')
    } else if (docType === 'teamMember') {
      revalidatePath('/')
    } else if (docType === 'brand') {
      revalidatePath('/')
    } else {
      // Unknown type — revalidate everything
      revalidatePath('/', 'layout')
    }

    return NextResponse.json({ revalidated: true, docType, slug, ts: Date.now() })
  } catch {
    return NextResponse.json({ message: 'Error parsing body' }, { status: 400 })
  }
}

// Also allow GET for manual trigger during development
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('secret')
  if (SECRET && token !== SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 })
  }
  revalidatePath('/', 'layout')
  revalidatePath('/blog')
  return NextResponse.json({ revalidated: true, path: 'all', ts: Date.now() })
}
