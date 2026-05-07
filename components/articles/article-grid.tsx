'use client'

import { ArticleCard } from './article-card'
import type { ArticlePreview, ArticleWithScore } from '@/lib/types'

interface ArticleGridProps {
  articles: (ArticlePreview | ArticleWithScore)[]
  showScores?: boolean
  emptyMessage?: string
}

export function ArticleGrid({ 
  articles, 
  showScores = false,
  emptyMessage = 'No articles found'
}: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard 
          key={article.id} 
          article={article} 
          showScore={showScores}
        />
      ))}
    </div>
  )
}
