import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { query } from '@/lib/db'
import { getUserIdentity, getUserQueryParams, getUserInsertParams } from '@/lib/user-id'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, readPercentage = 0 } = body

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

    // Check if there's already a history entry for this article
    const { userIdCondition, params } = getUserQueryParams(identity)
    const existing = await query<{ id: number; read_percentage: number }[]>(`
      SELECT id, read_percentage 
      FROM reading_history 
      WHERE ${userIdCondition} AND article_id = ?
      ORDER BY read_at DESC
      LIMIT 1
    `, [...params, articleId])

    if (existing.length > 0) {
      // Update if new percentage is higher
      if (readPercentage > existing[0].read_percentage) {
        await query(`
          UPDATE reading_history 
          SET read_percentage = ?, read_at = NOW()
          WHERE id = ?
        `, [readPercentage, existing[0].id])
      }
    } else {
      // Create new entry
      await query(`
        INSERT INTO reading_history (user_id, anonymous_id, article_id, read_percentage, read_at)
        VALUES (?, ?, ?, ?, NOW())
      `, [userId, anonymousId, articleId, readPercentage])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording reading history:', error)
    return NextResponse.json(
      { error: 'Failed to record reading history' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const identity = await getUserIdentity()
    
    if (identity.type === 'anonymous' && !identity.anonymousId) {
      return NextResponse.json({ history: [] })
    }

    const { userIdCondition, params } = getUserQueryParams(identity, 'rh')

    const history = await query(`
      SELECT 
        rh.id,
        rh.article_id,
        rh.read_at,
        rh.read_percentage,
        a.title,
        a.slug,
        a.excerpt,
        a.image_url
      FROM reading_history rh
      JOIN articles a ON rh.article_id = a.id
      WHERE ${userIdCondition}
      ORDER BY rh.read_at DESC
      LIMIT 50
    `, params)

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Error fetching reading history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reading history' },
      { status: 500 }
    )
  }
}
