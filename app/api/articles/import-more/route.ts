import { NextRequest, NextResponse } from 'next/server'
import { autoImportArticlesForSearch } from '@/lib/rss-importer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const search = String(body.search || '').trim()
    const limit = Math.min(Math.max(Number(body.limit || 12), 1), 24)
    const mode = body.mode === 'previews' ? 'previews' : 'readable'

    if (search.length < 3) {
      return NextResponse.json(
        { error: 'Search must be at least 3 characters' },
        { status: 400 }
      )
    }

    const result = await autoImportArticlesForSearch(search, limit, {
      includeNewsFallback: mode === 'previews',
      requireReadableContent: mode === 'readable',
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Error importing more articles:', error)
    return NextResponse.json(
      { error: 'Failed to find more online articles' },
      { status: 500 }
    )
  }
}
