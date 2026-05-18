import { Suspense } from 'react'
import { ArticleBrowseControls } from '@/components/search/article-browse-controls'
import { ArticleGrid } from '@/components/articles/article-grid'
import { ArticlePagination } from '@/components/articles/article-pagination'
import { FindMoreOnlineButton } from '@/components/articles/find-more-online-button'
import { Skeleton } from '@/components/ui/skeleton'
import type { ArticlePreview, Category, Source } from '@/lib/types'

interface ArticlesResponse {
  articles: ArticlePreview[]
  total: number
  categories: Category[]
  sources: Source[]
  onlineImport?: {
    attempted: boolean
    imported: number
    searchedSources: number
  } | null
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
  if (searchParams.source) {
    params.set('source', String(searchParams.source))
  }
  if (searchParams.sort) {
    params.set('sort', String(searchParams.sort))
  }

  const limit = 12
  const page = Math.max(parseInt(String(searchParams.page || '1')), 1)
  params.set('limit', String(limit))
  params.set('offset', String((page - 1) * limit))

  if (searchParams.offset) {
    params.set('offset', String(searchParams.offset))
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  
  try {
    const res = await fetch(`${baseUrl}/api/articles?${params.toString()}`, {
      cache: 'no-store',
    })
    
    if (!res.ok) {
      return { articles: [], total: 0, categories: [], sources: [], pagination: { limit, offset: 0, hasMore: false } }
    }
    
    return res.json()
  } catch {
    return { articles: [], total: 0, categories: [], sources: [], pagination: { limit, offset: 0, hasMore: false } }
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
          <ArticleBrowseControls categories={data.categories} sources={data.sources} />
        </Suspense>
      </div>
      
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          {data.total} article{data.total !== 1 ? 's' : ''} found
        </p>
        {data.onlineImport?.attempted && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
            {data.onlineImport.imported > 0
              ? `No local matches were found, so ${data.onlineImport.imported} online article preview${data.onlineImport.imported === 1 ? '' : 's'} were added from trusted web sources.`
              : `No local matches were found, and no longer readable web articles were available from ${data.onlineImport.searchedSources} sources.`}
          </div>
        )}
        <ArticleGrid 
          articles={data.articles}
          emptyMessage="No articles found. Try adjusting your search or filters."
        />
      </div>

      <ArticlePagination
        total={data.total}
        limit={data.pagination.limit}
        offset={data.pagination.offset}
        searchParams={searchParams}
      />

      {typeof searchParams.search === 'string' && searchParams.search.trim().length >= 3 && (
        <FindMoreOnlineButton search={searchParams.search.trim()} />
      )}
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
