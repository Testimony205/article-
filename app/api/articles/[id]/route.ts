import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import type { Article } from '@/lib/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if id is a slug (contains non-numeric characters) or numeric ID
    const isSlug = isNaN(parseInt(id))
    
    const articles = await query<Article[]>(
      isSlug
        ? `SELECT * FROM articles WHERE slug = ?`
        : `SELECT * FROM articles WHERE id = ?`,
      [id]
    )

    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const article = articles[0]
    
    // Parse tags if stored as JSON string
    if (article.tags && typeof article.tags === 'string') {
      try {
        article.tags = JSON.parse(article.tags)
      } catch {
        article.tags = null
      }
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}
