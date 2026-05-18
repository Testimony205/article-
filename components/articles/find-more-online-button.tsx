'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Loader2, Newspaper } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FindMoreOnlineButtonProps {
  search: string
}

export function FindMoreOnlineButton({ search }: FindMoreOnlineButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleClick = async (mode: 'readable' | 'previews') => {
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/articles/import-more', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ search, limit: 12, mode }),
      })

      const data = await response.json()

      if (!response.ok) {
        setMessage(data.error || 'Could not find more articles right now.')
        return
      }

      setMessage(
        data.imported > 0
          ? `Added ${data.imported} ${mode === 'readable' ? 'readable' : 'web preview'} result${data.imported === 1 ? '' : 's'}.`
          : mode === 'readable'
            ? 'No longer readable articles were found from the available sources.'
            : 'No new web previews were found right now.'
      )
      router.refresh()
    } catch {
      setMessage('Could not find more articles right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/20 p-4 text-center">
      <p className="text-sm text-muted-foreground">
        Not seeing what you need? Try more readable articles first, or include shorter web previews.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={() => handleClick('readable')} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Find Readable Articles
        </Button>
        <Button type="button" variant="outline" onClick={() => handleClick('previews')} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Newspaper className="h-4 w-4" />}
          Show Web Previews
        </Button>
      </div>
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
