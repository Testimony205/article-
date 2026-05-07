import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getUserIdentity, getUserQueryParams } from '@/lib/user-id'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ articleId: string }> }
) {
  try {
    const { articleId } = await params
    const identity = await getUserIdentity()
    
    if (identity.type === 'anonymous' && !identity.anonymousId) {
      return NextResponse.json({ bookmarked: false })
    }

    const { userIdCondition, params: queryParams } = getUserQueryParams(identity)

    const existing = await query<{ id: number }[]>(`
      SELECT id FROM bookmarks 
      WHERE ${userIdCondition} AND article_id = ?
    `, [...queryParams, articleId])

    return NextResponse.json({ bookmarked: existing.length > 0 })
  } catch (error) {
    console.error('Error checking bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to check bookmark status' },
      { status: 500 }
    )
  }
}
