'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Clock, User } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ArticlePreview, ArticleWithScore } from '@/lib/types'

interface ArticleCardProps {
  article: ArticlePreview | ArticleWithScore
  showScore?: boolean
}

export function ArticleCard({ article, showScore = false }: ArticleCardProps) {
  const hasScore = 'similarity_score' in article
  const score = hasScore ? (article as ArticleWithScore).similarity_score : 0

  return (
    <Link href={`/articles/${article.slug}`}>
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
        {article.image_url && (
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {article.category && (
              <Badge 
                variant="secondary" 
                className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
              >
                {article.category}
              </Badge>
            )}
          </div>
        )}
        
        <CardHeader className="pb-2">
          {!article.image_url && article.category && (
            <Badge variant="secondary" className="w-fit mb-2">
              {article.category}
            </Badge>
          )}
          <h3 className="text-lg font-semibold leading-tight line-clamp-2 text-balance group-hover:text-primary transition-colors">
            {article.title}
          </h3>
        </CardHeader>
        
        <CardContent className="pb-2">
          {article.excerpt && (
            <p className="text-muted-foreground text-sm line-clamp-3">
              {article.excerpt}
            </p>
          )}
        </CardContent>
        
        <CardFooter className="pt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author}
              </span>
            )}
            {article.reading_time && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.reading_time} min
              </span>
            )}
          </div>
          {showScore && hasScore && score > 0 && (
            <span className="text-primary font-medium">
              {Math.round(score * 100)}% match
            </span>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}
