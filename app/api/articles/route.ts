import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { searchArticles, getCategories } from '@/lib/recommendation-engine'
import type { ArticlePreview } from '@/lib/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let articles: ArticlePreview[]

    if (search) {
      // Use FULLTEXT search
      articles = await searchArticles(search, limit)
    } else if (category) {
      // Filter by category
      articles = await query<ArticlePreview[]>(`
        SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
        FROM articles
        WHERE category = ?
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [category, limit, offset])
    } else {
      // Get all articles
      articles = await query<ArticlePreview[]>(`
        SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
        FROM articles
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset])
    }

    // Get total count for pagination
    const countResult = await query<[{ total: number }]>(`
      SELECT COUNT(*) as total FROM articles
      ${category ? 'WHERE category = ?' : ''}
    `, category ? [category] : [])

    const total = countResult[0]?.total || 0

    // Get categories for filter
    const categories = await getCategories()

    return NextResponse.json({
      articles,
      total,
      categories,
      pagination: {
        limit,
        offset,
        hasMore: offset + articles.length < total,
      },
    })
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
