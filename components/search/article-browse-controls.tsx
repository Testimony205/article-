'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Category, Source } from '@/lib/types'

interface ArticleBrowseControlsProps {
  categories: Category[]
  sources: Source[]
}

export function ArticleBrowseControls({ categories, sources }: ArticleBrowseControlsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const currentCategory = searchParams.get('category') || 'all'
  const currentSource = searchParams.get('source') || 'all'
  const currentSort = searchParams.get('sort') || 'newest'

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    }

    params.delete('page')
    params.delete('offset')
    router.push(`/articles?${params.toString()}`)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    updateParams({ search: search.trim() || null })
  }

  const clearAll = () => {
    setSearch('')
    router.push('/articles')
  }

  return (
    <div className="rounded-lg border bg-card p-4">
      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="article-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="article-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or article text..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={currentCategory} onValueChange={(value) => updateParams({ category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.category} value={category.category}>
                  {category.category} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Source</Label>
          <Select value={currentSource} onValueChange={(value) => updateParams({ source: value })}>
            <SelectTrigger>
              <SelectValue placeholder="All sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source.source_name} value={source.source_name}>
                  {source.source_name} ({source.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort</Label>
          <Select value={currentSort} onValueChange={(value) => updateParams({ sort: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Newest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end gap-2">
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" size="icon" onClick={clearAll}>
            <X className="h-4 w-4" />
            <span className="sr-only">Clear filters</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
