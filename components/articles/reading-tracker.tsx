'use client'

import { useEffect, useRef } from 'react'

interface ReadingTrackerProps {
  articleId: number
}

export function ReadingTracker({ articleId }: ReadingTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) return
    hasTracked.current = true

    // Record that the user started reading this article
    const recordRead = async () => {
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId,
            readPercentage: 0,
          }),
        })
      } catch {
        // Silently fail - reading history is non-critical
      }
    }

    recordRead()

    // Track scroll progress
    const updateProgress = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const percentage = Math.min(100, Math.round((scrollTop / docHeight) * 100))
      
      // Only update at certain thresholds to reduce API calls
      if (percentage === 25 || percentage === 50 || percentage === 75 || percentage >= 90) {
        fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleId,
            readPercentage: percentage,
          }),
        }).catch(() => {
          // Silently fail
        })
      }
    }

    // Debounced scroll handler
    let timeout: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(updateProgress, 500)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timeout)
    }
  }, [articleId])

  return null
}
