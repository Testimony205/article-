import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ArticlePaginationProps {
  total: number
  limit: number
  offset: number
  searchParams: { [key: string]: string | string[] | undefined }
}

export function ArticlePagination({ total, limit, offset, searchParams }: ArticlePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const currentPage = Math.floor(offset / limit) + 1

  if (totalPages <= 1) return null

  const pages = getVisiblePages(currentPage, totalPages)

  return (
    <nav className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild variant="outline" size="sm" className={cn(currentPage === 1 && 'pointer-events-none opacity-50')}>
          <Link href={buildPageHref(searchParams, currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Link>
        </Button>

        {pages.map((page) => (
          <Button
            key={page}
            asChild
            variant={page === currentPage ? 'default' : 'outline'}
            size="sm"
            className="min-w-9"
          >
            <Link href={buildPageHref(searchParams, page)}>{page}</Link>
          </Button>
        ))}

        <Button asChild variant="outline" size="sm" className={cn(currentPage === totalPages && 'pointer-events-none opacity-50')}>
          <Link href={buildPageHref(searchParams, currentPage + 1)}>
            Next
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </nav>
  )
}

function buildPageHref(searchParams: ArticlePaginationProps['searchParams'], page: number): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(searchParams)) {
    if (key === 'offset') continue
    if (Array.isArray(value)) {
      if (value[0]) params.set(key, value[0])
    } else if (value) {
      params.set(key, value)
    }
  }

  if (page <= 1) {
    params.delete('page')
  } else {
    params.set('page', String(page))
  }

  const query = params.toString()
  return query ? `/articles?${query}` : '/articles'
}

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 2)
  const end = Math.min(totalPages, currentPage + 2)
  const pages: number[] = []

  for (let page = start; page <= end; page++) {
    pages.push(page)
  }

  return pages
}
