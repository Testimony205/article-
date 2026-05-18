import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { getUserIdentity, getUserQueryParams, getUserInsertParams } from '@/lib/user-id'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const identity = await getUserIdentity()
    
    if (identity.type === 'anonymous' && !identity.anonymousId) {
      return NextResponse.json({ bookmarks: [] })
    }

    const bookmarks = await query(`
      SELECT 
        b.id,
        b.article_id,
        b.created_at,
        a.title,
        a.slug,
        a.excerpt,
        a.author,
        a.category,
        a.image_url,
        a.reading_time
      FROM bookmarks b
      JOIN articles a ON b.article_id = a.id
      WHERE b.user_id = ? OR b.anonymous_id = ?
    `, [identity.userId || null, identity.anonymousId || null])

    return NextResponse.json({ bookmarks })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    let identity = await getUserIdentity()
    
    // If no identity, create anonymous ID
    if (identity.type === 'anonymous' && !identity.anonymousId) {
      const newAnonymousId = uuidv4()
      const cookieStore = await cookies()
      cookieStore.set('anonymous_id', newAnonymousId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365, // 1 year
      })
      identity = { type: 'anonymous', anonymousId: newAnonymousId }
    }

    const { userId, anonymousId } = getUserInsertParams(identity)

    // Check if bookmark already exists
    const existing = await query<{ id: number }[]>(`
      SELECT id FROM bookmarks 
      WHERE (user_id = ? OR anonymous_id = ?) AND article_id = ?
    `, [userId, anonymousId, articleId])

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        bookmarked: true,
        message: 'Already bookmarked' 
      })
    }

    // Create bookmark
    await query(`
      INSERT INTO bookmarks (user_id, anonymous_id, article_id, created_at)
      VALUES (?, ?, ?, NOW())
    `, [userId, anonymousId, articleId])

    return NextResponse.json({ 
      success: true, 
      bookmarked: true,
      message: 'Bookmark added' 
    })
  } catch (error) {
    console.error('Error creating bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to create bookmark' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    const identity = await getUserIdentity()
    
    if (identity.type === 'anonymous' && !identity.anonymousId) {
      return NextResponse.json({ success: true, bookmarked: false })
    }

    const { userId, anonymousId } = getUserInsertParams(identity)

    await query(`
      DELETE FROM bookmarks 
      WHERE (user_id = ? OR anonymous_id = ?) AND article_id = ?
    `, [userId, anonymousId, articleId])

    return NextResponse.json({ 
      success: true, 
      bookmarked: false,
      message: 'Bookmark removed' 
    })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to delete bookmark' },
      { status: 500 }
    )
  }
}
