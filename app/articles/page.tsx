import { Suspense } from 'react'
import { SearchBar } from '@/components/search/search-bar'
import { CategoryFilter } from '@/components/search/category-filter'
import { ArticleGrid } from '@/components/articles/article-grid'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticlePreview, Category } from '@/lib/types'

interface ArticlesResponse {
  articles: ArticlePreview[]
  total: number
  categories: Category[]
  pagination: {
    limit: number
    offset: number
    hasMore: boolean
  }
}

async function getArticles(searchParams: { [key: string]: string | string[] | undefined }): Promise<ArticlesResponse> {
  const params = new URLSearchParams()
  
  if (searchParams.search) {
    params.set('search', String(searchParams.search))
  }
  if (searchParams.category) {
    params.set('category', String(searchParams.category))
  }
  if (searchParams.offset) {
    params.set('offset', String(searchParams.offset))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  try {
    const res = await fetch(`${baseUrl}/api/articles?${params.toString()}`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      return { articles: [], total: 0, categories: [], pagination: { limit: 20, offset: 0, hasMore: false } }
    }
    
    return res.json()
  } catch {
    return { articles: [], total: 0, categories: [], pagination: { limit: 20, offset: 0, hasMore: false } }
  }
}

function ArticlesLoading() {
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

async function ArticlesList({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const data = await getArticles(searchParams)
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <Suspense fallback={<Skeleton className="h-10 w-full" />}>
          <SearchBar />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-8 w-64" />}>
          <CategoryFilter categories={data.categories} />
        </Suspense>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {data.total} article{data.total !== 1 ? 's' : ''} found
        </p>
        <ArticleGrid 
          articles={data.articles}
          emptyMessage="No articles found. Try adjusting your search or filters."
        />
      </div>
    </div>
  )
}

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Discover Articles</h1>
          <p className="text-muted-foreground text-lg">
            Explore our collection of inspirational content
          </p>
        </header>

        <Suspense fallback={<ArticlesLoading />}>
          <ArticlesList searchParams={resolvedParams} />
        </Suspense>
      </div>
    </div>
  )
}
