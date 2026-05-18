import { hash, compare } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { query } from './db'

const BCRYPT_ROUNDS = 10
const SESSION_DURATION_HOURS = 24

interface User {
  id: number
  email: string
  name: string | null
  role: 'user' | 'admin'
  created_at: Date
}

interface UserWithPassword extends User {
  password: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

/**
 * Generate a secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex') // 64 character hex string
}

/**
 * Create a new user account
 */
export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const hashedPassword = await hashPassword(password)

  const result = await query<{ insertId: number }>(`
    INSERT INTO users (email, password, name, created_at)
    VALUES (?, ?, ?, NOW())
  `, [email, hashedPassword, name || null])

  // Get insertId from result
  const insertId = (result as unknown as { insertId: number }).insertId

  return {
    id: insertId,
    email,
    name: name || null,
    role: 'user',
    created_at: new Date(),
  }
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const users = await query<UserWithPassword[]>(`
    SELECT id, email, password, name, role, created_at
    FROM users
    WHERE email = ?
  `, [email])

  return users.length > 0 ? users[0] : null
}

/**
 * Find a user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  const users = await query<User[]>(`
    SELECT id, email, name, role, created_at
    FROM users
    WHERE id = ?
  `, [id])

  return users.length > 0 ? users[0] : null
}

/**
 * Create a session for a user
 */
export async function createSession(userId: number): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000)

  await query(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `, [token, userId, expiresAt])

  return token
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await query(`
    DELETE FROM sessions
    WHERE token = ?
  `, [token])
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await query(`
    DELETE FROM sessions
    WHERE expires_at < NOW()
  `)
}

/**
 * Get the current authenticated user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  if (!sessionToken) return null

  const results = await query<Array<User & { expires_at: Date }>>(`
    SELECT u.id, u.email, u.name, u.role, u.created_at, s.expires_at
    FROM users u
    JOIN sessions s ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > NOW()
  `, [sessionToken])

  return results.length > 0 ? results[0] : null
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getCurrentUser()
  return isAdmin(user) ? user : null
}

/**
 * Merge anonymous user data to authenticated user on login
 */
export async function mergeAnonymousData(
  userId: number,
  anonymousId: string
): Promise<void> {
  // Merge reading history
  await query(`
    UPDATE reading_history
    SET user_id = ?, anonymous_id = NULL
    WHERE anonymous_id = ?
  `, [userId, anonymousId])

  // Merge bookmarks (ignore duplicates)
  await query(`
    INSERT IGNORE INTO bookmarks (user_id, article_id, created_at)
    SELECT ?, article_id, created_at
    FROM bookmarks
    WHERE anonymous_id = ?
  `, [userId, anonymousId])

  // Delete old anonymous bookmarks
  await query(`
    DELETE FROM bookmarks
    WHERE anonymous_id = ?
  `, [anonymousId])
}
