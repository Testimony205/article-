'use client'

import useSWR from 'swr'
import { ArticleCard } from './article-card'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticleWithScore } from '@/lib/types'

interface RelatedArticlesProps {
  articleId: number
  limit?: number
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function RelatedArticles({ articleId, limit = 5 }: RelatedArticlesProps) {
  const { data, error, isLoading } = useSWR(
    `/api/articles/${articleId}/related?limit=${limit}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Related Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
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
      <h2 className="text-2xl font-semibold">Related Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            showScore={true}
          />
        ))}
      </div>
    </section>
  )
}
