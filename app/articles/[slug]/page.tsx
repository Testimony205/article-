import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ArticleContent } from '@/components/articles/article-content'
import { RelatedArticles } from '@/components/articles/related-articles'
import { ReadingTracker } from '@/components/articles/reading-tracker'
import { Skeleton } from '@/components/ui/skeleton'
import type { Article } from '@/lib/types'

async function getArticle(slug: string): Promise<Article | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(`${baseUrl}/api/articles/${slug}`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      return null
    }
    
    return res.json()
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(slug)
  
  if (!article) {
    return {
      title: 'Article Not Found',
    }
  }
  
  return {
    title: article.title,
    description: article.excerpt || `Read ${article.title} on Inspire`,
  }
}

function ArticleLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = await getArticle(slug)
  
  if (!article) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ArticleLoading />}>
        <ArticleContent article={article} />
      </Suspense>
      
      {/* Reading tracker - records history */}
      <ReadingTracker articleId={article.id} />
      
      {/* Related Articles */}
      <div className="max-w-5xl mx-auto mt-16 pt-8 border-t">
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <RelatedArticles articleId={article.id} />
        </Suspense>
      </div>
    </div>
  )
}
