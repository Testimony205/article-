import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getCategories } from '@/lib/recommendation-engine'
import { vectorizeArticle } from '@/lib/vectorizer'
import { requireAdmin } from '@/lib/auth'
import { getUserIdentity, getUserInsertParams } from '@/lib/user-id'
import { autoImportArticlesForSearch } from '@/lib/rss-importer'
import type { ArticlePreview, Source } from '@/lib/types'

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    if (!user) {
      return NextResponse.json(
        { error: 'Only admins can upload articles' },
        { status: 403 }
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
    const source = searchParams.get('source')
    const sort = searchParams.get('sort') || 'newest'
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '12'), 1), 48)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const where: string[] = []
    const params: unknown[] = []
    let scoreSelect = ''
    let orderBy = 'a.created_at DESC'

    if (search) {
      const identity = await getUserIdentity()
      const { userId, anonymousId } = getUserInsertParams(identity)

      await query(`
        INSERT INTO search_logs (user_id, anonymous_id, query_text, created_at)
        VALUES (?, ?, ?, NOW())
      `, [userId, anonymousId, search.trim().slice(0, 255)])

      where.push('(MATCH(a.title, a.body) AGAINST(? IN NATURAL LANGUAGE MODE) OR a.title LIKE ? OR a.excerpt LIKE ?)')
      params.push(search, `%${search}%`, `%${search}%`)
      scoreSelect = ', MATCH(a.title, a.body) AGAINST(? IN NATURAL LANGUAGE MODE) AS search_score'
      orderBy = 'search_score DESC, a.created_at DESC'
    }

    if (category) {
      where.push('a.category = ?')
      params.push(category)
    }

    if (source) {
      where.push('a.source_name = ?')
      params.push(source)
    }

    if (!search) {
      if (sort === 'oldest') orderBy = 'a.created_at ASC'
      if (sort === 'title') orderBy = 'a.title ASC'
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : ''
    const articleParams = search ? [search, ...params] : params

    let articles = await query<ArticlePreview[]>(`
      SELECT
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.author,
        a.category,
        a.image_url,
        a.source_name,
        a.content_quality,
        a.reading_time,
        a.created_at
        ${scoreSelect}
      FROM articles a
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `, articleParams)

    const countResult = await query<[{ total: number }]>(`
      SELECT COUNT(*) as total
      FROM articles a
      ${whereClause}
    `, params)

    let total = countResult[0]?.total || 0
    let onlineImport: { attempted: boolean; imported: number; searchedSources: number } | null = null

    if (search && total === 0 && offset === 0) {
      const importResult = await autoImportArticlesForSearch(search, limit, {
        includeNewsFallback: false,
        requireReadableContent: true,
      })
      onlineImport = {
        attempted: true,
        imported: importResult.imported,
        searchedSources: importResult.searchedSources,
      }

      if (importResult.imported > 0) {
        articles = await query<ArticlePreview[]>(`
          SELECT
            a.id,
            a.title,
            a.slug,
            a.excerpt,
            a.author,
            a.category,
            a.image_url,
            a.source_name,
            a.content_quality,
            a.reading_time,
            a.created_at
            ${scoreSelect}
          FROM articles a
          ${whereClause}
          ORDER BY ${orderBy}
          LIMIT ${limit} OFFSET ${offset}
        `, articleParams)

        const refreshedCount = await query<[{ total: number }]>(`
          SELECT COUNT(*) as total
          FROM articles a
          ${whereClause}
        `, params)

        total = refreshedCount[0]?.total || 0
      }
    }

    const [categories, sources] = await Promise.all([
      getCategories(),
      query<Source[]>(`
        SELECT source_name, COUNT(*) as count
        FROM articles
        WHERE source_name IS NOT NULL AND source_name <> ''
        GROUP BY source_name
        ORDER BY count DESC, source_name ASC
      `),
    ])

    return NextResponse.json({
      articles,
      total,
      categories,
      sources,
      onlineImport,
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
