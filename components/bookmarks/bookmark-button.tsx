'use client'

import { useState, useEffect } from 'react'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  articleId: number
  variant?: 'default' | 'icon'
  className?: string
}

export function BookmarkButton({ 
  articleId, 
  variant = 'default',
  className 
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    const checkBookmark = async () => {
      try {
        const res = await fetch(`/api/bookmarks/${articleId}`)
        const data = await res.json()
        setBookmarked(data.bookmarked)
      } catch {
        // Ignore errors
      } finally {
        setLoading(false)
      }
    }

    checkBookmark()
  }, [articleId])

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setToggling(true)
    
    try {
      if (bookmarked) {
        await fetch(`/api/bookmarks?articleId=${articleId}`, {
          method: 'DELETE',
        })
        setBookmarked(false)
      } else {
        await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ articleId }),
        })
        setBookmarked(true)
      }
    } catch {
      // Revert on error
      setBookmarked(!bookmarked)
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <Button 
        variant={variant === 'icon' ? 'ghost' : 'outline'} 
        size={variant === 'icon' ? 'icon' : 'sm'}
        disabled
        className={className}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {variant === 'default' && <span className="ml-2">Loading...</span>}
      </Button>
    )
  }

  return (
    <Button
      variant={variant === 'icon' ? 'ghost' : 'outline'}
      size={variant === 'icon' ? 'icon' : 'sm'}
      onClick={toggleBookmark}
      disabled={toggling}
      className={cn(
        bookmarked && 'text-primary',
        className
      )}
    >
      {toggling ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : bookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      {variant === 'default' && (
        <span className="ml-2">
          {bookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  )
}
