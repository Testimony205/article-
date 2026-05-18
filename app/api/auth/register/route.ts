import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createUser, findUserByEmail, createSession, mergeAnonymousData } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, password, name)

    // Create session
    const sessionToken = await createSession(user.id)

    // Get anonymous ID to merge data
    const cookieStore = await cookies()
    const anonymousId = cookieStore.get('anonymous_id')?.value

    // Merge anonymous data if exists
    if (anonymousId) {
      await mergeAnonymousData(user.id, anonymousId)
      cookieStore.delete('anonymous_id')
    }

    // Set session cookie
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error registering user:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}
