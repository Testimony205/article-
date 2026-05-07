export interface Article {
  id: number
  user_id: number | null
  title: string
  slug: string
  body: string
  excerpt: string | null
  author: string | null
  category: string | null
  tags: string[] | null
  image_url: string | null
  reading_time: number | null
  created_at: Date
  updated_at: Date
}

export interface ArticlePreview {
  id: number
  title: string
  slug: string
  excerpt: string | null
  author: string | null
  category: string | null
  image_url: string | null
  reading_time: number | null
  created_at: Date
}

export interface ArticleWithScore extends ArticlePreview {
  similarity_score: number
}

export interface User {
  id: number
  email: string
  name: string | null
  created_at: Date
}

export interface ReadingHistoryItem {
  id: number
  article_id: number
  read_at: Date
  read_percentage: number
}

export interface Bookmark {
  id: number
  article_id: number
  created_at: Date
}

export interface Category {
  category: string
  count: number
}
