import { query } from './db'
import { getAllVectors, getArticleVector, getVectorsByIds } from './vectorizer'
import { findMostSimilar, weightedAverageVector, rankByPreference } from './cosine-similarity'
import type { TFIDFVector } from './tfidf'
import { getUserIdentity, getUserQueryParams } from './user-id'

interface Article {
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

interface ArticleWithScore extends Article {
  similarity_score: number
}

/**
 * Get related articles for a given article using cosine similarity
 */
export async function getRelatedArticles(
  articleId: number,
  limit: number = 5
): Promise<ArticleWithScore[]> {
  // Get the target article's vector
  const targetVector = await getArticleVector(articleId)
  if (!targetVector) {
    return []
  }

  // Get all vectors
  const allVectors = await getAllVectors()

  // Find most similar articles (excluding the target)
  const similar = findMostSimilar(
    targetVector,
    allVectors,
    new Set([articleId]),
    limit
  )

  if (similar.length === 0) {
    return []
  }

  // Get article details
  const articleIds = similar.map(([id]) => id)
  const placeholders = articleIds.map(() => '?').join(',')
  
  const articles = await query<Article[]>(`
    SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
    FROM articles
    WHERE id IN (${placeholders})
  `, articleIds)

  // Map scores to articles
  const scoreMap = new Map(similar)
  return articles
    .map(article => ({
      ...article,
      similarity_score: scoreMap.get(article.id) || 0,
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
}

/**
 * Get personalized recommendations based on reading history
 */
export async function getPersonalizedRecommendations(
  limit: number = 10
): Promise<ArticleWithScore[]> {
  const identity = await getUserIdentity()
  
  if (identity.type === 'anonymous' && !identity.anonymousId) {
    // No identity - return popular/recent articles
    return getDefaultRecommendations(limit)
  }

  const { userIdCondition, params } = getUserQueryParams(identity)

  // Get user's recent reading history (last 20 articles)
  const history = await query<{ article_id: number; read_at: Date }[]>(`
    SELECT article_id, read_at
    FROM reading_history
    WHERE ${userIdCondition}
    ORDER BY read_at DESC
    LIMIT 20
  `, params)

  if (history.length === 0) {
    return getDefaultRecommendations(limit)
  }

  const readArticleIds = history.map(h => h.article_id)
  
  // Get vectors for read articles
  const readVectors = await getVectorsByIds(readArticleIds)

  if (readVectors.size === 0) {
    return getDefaultRecommendations(limit)
  }

  // Calculate recency weights (more recent = higher weight)
  const weights: number[] = []
  const vectorArray: TFIDFVector[] = []
  
  for (let i = 0; i < history.length; i++) {
    const articleId = history[i].article_id
    const vector = readVectors.get(articleId)
    if (vector) {
      vectorArray.push(vector)
      // Exponential decay: more recent articles have higher weight
      weights.push(Math.exp(-i * 0.1))
    }
  }

  // Create user preference vector
  const preferenceVector = weightedAverageVector(vectorArray, weights)

  // Get all article vectors
  const allVectors = await getAllVectors()

  // Rank articles by similarity to preference vector
  const excludeIds = new Set(readArticleIds)
  const ranked = rankByPreference(preferenceVector, allVectors, excludeIds)
    .slice(0, limit)

  if (ranked.length === 0) {
    return getDefaultRecommendations(limit)
  }

  // Get article details
  const articleIds = ranked.map(r => r.articleId)
  const placeholders = articleIds.map(() => '?').join(',')
  
  const articles = await query<Article[]>(`
    SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
    FROM articles
    WHERE id IN (${placeholders})
  `, articleIds)

  // Map scores to articles
  const scoreMap = new Map(ranked.map(r => [r.articleId, r.score]))
  return articles
    .map(article => ({
      ...article,
      similarity_score: scoreMap.get(article.id) || 0,
    }))
    .sort((a, b) => b.similarity_score - a.similarity_score)
}

/**
 * Get default recommendations (for users with no history)
 * Returns recent popular articles
 */
async function getDefaultRecommendations(limit: number): Promise<ArticleWithScore[]> {
  const articles = await query<Article[]>(`
    SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
    FROM articles
    ORDER BY created_at DESC
    LIMIT ${Number(limit)}
  `)

  return articles.map((article, index) => ({
    ...article,
    similarity_score: 1 - (index * 0.05), // Decreasing scores for ranking
  }))
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(
  category: string,
  limit: number = 20
): Promise<Article[]> {
  return query<Article[]>(`
    SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
    FROM articles
    WHERE category = ?
    ORDER BY created_at DESC
    LIMIT ${Number(limit)}
  `, [category])
}

/**
 * Search articles using MySQL FULLTEXT
 */
export async function searchArticles(
  searchQuery: string,
  limit: number = 20
): Promise<Article[]> {
  return query<Article[]>(`
    SELECT id, title, slug, excerpt, author, category, image_url, reading_time, created_at
    FROM articles
    WHERE MATCH(title, body) AGAINST(? IN NATURAL LANGUAGE MODE)
    LIMIT ${Number(limit)}
  `, [searchQuery])
}

/**
 * Get all categories with article counts
 */
export async function getCategories(): Promise<Array<{ category: string; count: number }>> {
  return query<Array<{ category: string; count: number }>>(`
    SELECT category, COUNT(*) as count
    FROM articles
    WHERE category IS NOT NULL
    GROUP BY category
    ORDER BY count DESC
  `)
}
