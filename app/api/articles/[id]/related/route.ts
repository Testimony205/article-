import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getRelatedArticles } from '@/lib/recommendation-engine'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5')
    
    // Check if id is a slug or numeric ID
    let articleId: number
    
    if (isNaN(parseInt(id))) {
      // It's a slug, get the numeric ID
      const articles = await query<Array<{ id: number }>>(
        `SELECT id FROM articles WHERE slug = ?`,
        [id]
      )
      
      if (articles.length === 0) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }
      
      articleId = articles[0].id
    } else {
      articleId = parseInt(id)
    }

    const relatedArticles = await getRelatedArticles(articleId, limit)

    return NextResponse.json({
      articles: relatedArticles,
      articleId,
    })
  } catch (error) {
    console.error('Error fetching related articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related articles' },
      { status: 500 }
    )
  }
}
