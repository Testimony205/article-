'use client'

import useSWR from 'swr'
import { Sparkles } from 'lucide-react'
import { ArticleCard } from '@/components/articles/article-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticleWithScore } from '@/lib/types'

interface PersonalizedFeedProps {
  limit?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function PersonalizedFeed({ limit = 6 }: PersonalizedFeedProps) {
  const { data, error, isLoading } = useSWR(
    `/api/recommendations?limit=${limit}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-semibold">For You</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data?.articles?.length) {
    return null
  }

  const articles: ArticleWithScore[] = data.articles

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-semibold">For You</h2>
        {data.personalized && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            Personalized
          </span>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article}
            showScore={data.personalized}
          />
        ))}
      </div>
    </section>
  )
}
