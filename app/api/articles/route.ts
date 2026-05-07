import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { searchArticles, getCategories } from '@/lib/recommendation-engine'
import { vectorizeArticle } from '@/lib/vectorizer'
import { getCurrentUser } from '@/lib/auth'
import type { ArticlePreview } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to upload articles' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { title, body: content, excerpt, author, category, tags, image_url, reading_time } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      + '-' + Math.random().toString(36).substring(2, 7)

    const result = await query<{ insertId: number }>(`
      INSERT INTO articles (user_id, title, slug, body, excerpt, author, category, tags, image_url, reading_time, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      user.id,
      title,
      slug,
      content,
      excerpt || null,
      author || user.name || null,
      category || null,
      tags ? JSON.stringify(tags) : null,
      image_url || null,
      reading_time || Math.ceil(content.split(/\s+/).length / 200)
    ])

    const insertId = (result as unknown as { insertId: number }).insertId

    // Run vectorizer on the new article
    await vectorizeArticle(insertId)

    return NextResponse.json({
      success: true,
      articleId: insertId,
      slug
    })
  } catch (error) {
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}

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
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `, [category])
    } else {
      // Get all articles
      articles = await query<ArticlePreview[]>(`
        SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
        FROM articles
        ORDER BY created_at DESC
        LIMIT ${Number(limit)} OFFSET ${Number(offset)}
      `)
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
