'use client'

import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export function UserIdentityInitializer() {
  useEffect(() => {
    // Check for anonymous_id cookie indirectly by checking if we need to set it
    // But the requirement says "stored in browser localStorage" and "Check localStorage for userId key"

    let userId = localStorage.getItem('userId')

    if (!userId) {
      userId = uuidv4()
      localStorage.setItem('userId', userId)
    }

    // Also set a cookie so the server can read it
    // Next.js Server Components cannot read localStorage
    const setCookie = (name: string, value: string, days: number) => {
      const expires = new Date()
      expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
      document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    }

    // If we have a userId in localStorage, make sure it's in the cookies too
    // This bridges the gap between client-side localStorage and server-side cookie requirement
    const cookies = document.cookie.split(';').map(c => c.trim())
    const anonCookie = cookies.find(c => c.startsWith('anonymous_id='))

    if (!anonCookie || anonCookie.split('=')[1] !== userId) {
      setCookie('anonymous_id', userId, 365)
    }
  }, [])

  return null
}
