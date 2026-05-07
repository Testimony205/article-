'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

interface CategoryFilterProps {
  categories: Category[]
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentCategory = searchParams.get('category')

  const handleCategoryClick = (category: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (category) {
      params.set('category', category)
    } else {
      params.delete('category')
    }
    
    // Reset search and pagination when changing category
    params.delete('search')
    params.delete('offset')
    
    router.push(`/articles?${params.toString()}`)
  }

  if (categories.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      <Badge
        variant={!currentCategory ? 'default' : 'outline'}
        className={cn(
          'cursor-pointer transition-colors',
          !currentCategory && 'bg-primary text-primary-foreground'
        )}
        onClick={() => handleCategoryClick(null)}
      >
        All
      </Badge>
      {categories.map(({ category, count }) => (
        <Badge
          key={category}
          variant={currentCategory === category ? 'default' : 'outline'}
          className={cn(
            'cursor-pointer transition-colors',
            currentCategory === category && 'bg-primary text-primary-foreground'
          )}
          onClick={() => handleCategoryClick(category)}
        >
          {category} ({count})
        </Badge>
      ))}
    </div>
  )
}
