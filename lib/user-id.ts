import { cookies } from 'next/headers'
import { query } from './db'

interface Session {
  user_id: number
  expires_at: Date
}

interface UserIdentity {
  type: 'authenticated' | 'anonymous'
  userId?: number
  anonymousId?: string
}

/**
 * Get the current user identity from request
 * Checks for session token first, then anonymous ID
 */
export async function getUserIdentity(): Promise<UserIdentity> {
  const cookieStore = await cookies()
  
  // Check for authenticated session
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (sessionToken) {
    const sessions = await query<Session[]>(`
      SELECT user_id, expires_at 
      FROM sessions 
      WHERE token = ? AND expires_at > NOW()
    `, [sessionToken])

    if (sessions.length > 0) {
      return {
        type: 'authenticated',
        userId: sessions[0].user_id,
      }
    }
  }

  // Fall back to anonymous ID
  const anonymousId = cookieStore.get('anonymous_id')?.value

  return {
    type: 'anonymous',
    anonymousId: anonymousId || undefined,
  }
}

/**
 * Get query parameters for user-specific database queries
 * Returns the appropriate WHERE clause conditions
 */
export function getUserQueryParams(identity: UserIdentity, tableAlias?: string): {
  userIdCondition: string
  params: (number | string | null)[]
} {
  const prefix = tableAlias ? `${tableAlias}.` : ''
  if (identity.type === 'authenticated' && identity.userId) {
    return {
      userIdCondition: `${prefix}user_id = ?`,
      params: [identity.userId],
    }
  } else if (identity.anonymousId) {
    return {
      userIdCondition: `${prefix}anonymous_id = ?`,
      params: [identity.anonymousId],
    }
  }
  
  // No valid identity
  return {
    userIdCondition: '1 = 0', // Always false - returns no results
    params: [],
  }
}

/**
 * Build INSERT parameters for user-associated records
 */
export function getUserInsertParams(identity: UserIdentity): {
  userId: number | null
  anonymousId: string | null
} {
  if (identity.type === 'authenticated' && identity.userId) {
    return {
      userId: identity.userId,
      anonymousId: null,
    }
  }
  
  return {
    userId: null,
    anonymousId: identity.anonymousId || null,
  }
}
