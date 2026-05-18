'use client'

import Image from 'next/image'
import { Clock, User, Calendar, ArrowLeft, ExternalLink, Newspaper } from 'lucide-react'
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
  const publicTags = tags.filter((tag: string) => !['imported', article.source_name].includes(tag))
  const plainBody = stripHtml(article.body)
  const isShortImportedPreview = Boolean(article.source_url && (article.content_quality === 'preview' || plainBody.split(/\s+/).length < 180))

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

      {isShortImportedPreview ? (
        <div className="space-y-6">
          <div className="rounded-lg border bg-muted/30 p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Newspaper className="h-4 w-4" />
              Source Preview
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {article.excerpt || plainBody}
            </p>
          </div>

          {article.source_url && (
            <Button asChild size="lg">
              <a href={article.source_url} target="_blank" rel="noreferrer" className="gap-2">
                Read full story
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <>
          <div 
            className="prose-article text-lg"
            dangerouslySetInnerHTML={{ __html: formatArticleBody(article.body) }}
          />

          {article.source_url && (
            <div className="mt-8 rounded-lg border bg-muted/30 p-4">
              <p className="mb-3 text-sm text-muted-foreground">
                Continue with the original publication for the complete source article.
              </p>
              <Button asChild variant="outline">
                <a href={article.source_url} target="_blank" rel="noreferrer" className="gap-2">
                  Read original article
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Tags */}
      {publicTags.length > 0 && (
        <div className="mt-10 pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            {publicTags.map((tag: string) => (
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

function stripHtml(body: string): string {
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
