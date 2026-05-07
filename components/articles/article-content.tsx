'use client'

import Image from 'next/image'
import { Clock, User, Calendar, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookmarkButton } from '@/components/bookmarks/bookmark-button'
import type { Article } from '@/lib/types'

interface ArticleContentProps {
  article: Article
}

export function ArticleContent({ article }: ArticleContentProps) {
  const formattedDate = new Date(article.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Parse tags if needed
  const tags = article.tags 
    ? (typeof article.tags === 'string' ? JSON.parse(article.tags) : article.tags)
    : []

  return (
    <article className="max-w-3xl mx-auto">
      {/* Back button */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/articles" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
          </Link>
        </Button>
      </div>

      {/* Header */}
      <header className="space-y-6 mb-8">
        {article.category && (
          <Badge variant="secondary" className="text-sm">
            {article.category}
          </Badge>
        )}
        
        <h1 className="text-4xl md:text-5xl font-bold leading-tight text-balance">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-muted-foreground leading-relaxed">
            {article.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          {article.author && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {article.author}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {formattedDate}
          </span>
          {article.reading_time && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {article.reading_time} min read
            </span>
          )}
          <div className="ml-auto">
            <BookmarkButton articleId={article.id} />
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {article.image_url && (
        <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-10">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Article Body */}
      <div 
        className="prose-article text-lg"
        dangerouslySetInnerHTML={{ __html: formatArticleBody(article.body) }}
      />

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-10 pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}

// Simple function to format article body with basic HTML
function formatArticleBody(body: string): string {
  // Convert newlines to paragraphs if the body doesn't contain HTML
  if (!body.includes('<p>') && !body.includes('<div>')) {
    return body
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')
  }
  return body
}
