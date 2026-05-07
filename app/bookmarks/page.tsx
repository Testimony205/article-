'use client'

import useSWR from 'swr'
import { Bookmark } from 'lucide-react'
import { ArticleGrid } from '@/components/articles/article-grid'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticlePreview } from '@/lib/types'

interface BookmarkItem {
  id: number
  article_id: number
  created_at: string
  title: string
  slug: string
  excerpt: string | null
  author: string | null
  category: string | null
  image_url: string | null
  reading_time: number | null
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

function BookmarksLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  )
}

function EmptyBookmarks() {
  return (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
        <Bookmark className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
      <p className="text-muted-foreground max-w-sm mx-auto">
        Save articles you want to read later by clicking the bookmark button on any article.
      </p>
    </div>
  )
}

export default function BookmarksPage() {
  const { data, error, isLoading } = useSWR('/api/bookmarks', fetcher)

  // Transform bookmark items to article previews
  const articles: ArticlePreview[] = data?.bookmarks?.map((item: BookmarkItem) => ({
    id: item.article_id,
    title: item.title,
    slug: item.slug,
    excerpt: item.excerpt,
    author: item.author,
    category: item.category,
    image_url: item.image_url,
    reading_time: item.reading_time,
    created_at: new Date(item.created_at),
  })) || []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Bookmarks</h1>
          <p className="text-muted-foreground text-lg">
            Articles you&apos;ve saved for later
          </p>
        </header>

        {isLoading ? (
          <BookmarksLoading />
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load bookmarks. Please try again.</p>
          </div>
        ) : articles.length === 0 ? (
          <EmptyBookmarks />
        ) : (
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              {articles.length} saved article{articles.length !== 1 ? 's' : ''}
            </p>
            <ArticleGrid articles={articles} />
          </div>
        )}
      </div>
    </div>
  )
}
