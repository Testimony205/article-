import { query } from './db'
import { TFIDFVectorizer, getTopKeywords, type TFIDFVector } from './tfidf'

interface Article {
  id: number
  title: string
  body: string
  tags?: string[] | string | null
}

interface ArticleVector {
  article_id: number
  tfidf_json: string
  keywords: string
}

/**
 * Get all articles from database
 */
async function getAllArticles(): Promise<Article[]> {
  return query<Article[]>(`
    SELECT id, title, body, tags 
    FROM articles
  `)
}

/**
 * Get all existing vectors from database
 */
export async function getAllVectors(): Promise<Map<number, TFIDFVector>> {
  const rows = await query<ArticleVector[]>(`
    SELECT article_id, tfidf_json 
    FROM article_vectors
  `)

  const vectors = new Map<number, TFIDFVector>()
  for (const row of rows) {
    try {
      vectors.set(row.article_id, JSON.parse(row.tfidf_json))
    } catch {
      console.error(`Failed to parse vector for article ${row.article_id}`)
    }
  }

  return vectors
}

/**
 * Get vector for a specific article
 */
export async function getArticleVector(articleId: number): Promise<TFIDFVector | null> {
  const rows = await query<ArticleVector[]>(`
    SELECT tfidf_json 
    FROM article_vectors 
    WHERE article_id = ?
  `, [articleId])

  if (rows.length === 0) return null

  try {
    return JSON.parse(rows[0].tfidf_json)
  } catch {
    return null
  }
}

/**
 * Create combined text from article for vectorization
 */
function createArticleText(article: Article): string {
  let text = `${article.title} ${article.title} ${article.body}` // Title weighted 2x
  
  // Add tags if present
  if (article.tags) {
    const tags = typeof article.tags === 'string' 
      ? JSON.parse(article.tags) 
      : article.tags
    if (Array.isArray(tags)) {
      text += ' ' + tags.join(' ')
    }
  }
  
  return text
}

/**
 * Recompute all TF-IDF vectors for the entire corpus
 * This should be called when:
 * 1. Initial setup
 * 2. Periodically to maintain accuracy as corpus grows
 */
export async function recomputeAllVectors(): Promise<void> {
  const articles = await getAllArticles()
  
  if (articles.length === 0) {
    console.log('No articles to vectorize')
    return
  }

  // Create text representations
  const texts = articles.map(createArticleText)
  
  // Fit and transform all documents
  const vectorizer = new TFIDFVectorizer()
  const vectors = vectorizer.fitTransform(texts)

  // Store each vector in the database
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i]
    const vector = vectors[i]
    const keywords = getTopKeywords(vector, 10).join(',')

    await query(`
      INSERT INTO article_vectors (article_id, tfidf_json, keywords, updated_at)
      VALUES (?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        tfidf_json = VALUES(tfidf_json),
        keywords = VALUES(keywords),
        updated_at = NOW()
    `, [article.id, JSON.stringify(vector), keywords])
  }

  console.log(`Vectorized ${articles.length} articles`)
}

/**
 * Compute and store vector for a single new/updated article
 * Uses existing corpus IDF values for consistency
 */
export async function vectorizeArticle(articleId: number): Promise<void> {
  // Get all articles to compute proper IDF
  const articles = await getAllArticles()
  const targetArticle = articles.find(a => a.id === articleId)
  
  if (!targetArticle) {
    throw new Error(`Article ${articleId} not found`)
  }

  // Create text representations for IDF calculation
  const texts = articles.map(createArticleText)
  
  // Fit vectorizer on full corpus
  const vectorizer = new TFIDFVectorizer()
  vectorizer.fit(texts)
  
  // Transform just the target article
  const targetText = createArticleText(targetArticle)
  const vector = vectorizer.transform(targetText)
  const keywords = getTopKeywords(vector, 10).join(',')

  // Store the vector
  await query(`
    INSERT INTO article_vectors (article_id, tfidf_json, keywords, updated_at)
    VALUES (?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE 
      tfidf_json = VALUES(tfidf_json),
      keywords = VALUES(keywords),
      updated_at = NOW()
  `, [articleId, JSON.stringify(vector), keywords])
}

/**
 * Get vectors for multiple articles by IDs
 */
export async function getVectorsByIds(articleIds: number[]): Promise<Map<number, TFIDFVector>> {
  if (articleIds.length === 0) return new Map()

  const placeholders = articleIds.map(() => '?').join(',')
  const rows = await query<ArticleVector[]>(`
    SELECT article_id, tfidf_json 
    FROM article_vectors 
    WHERE article_id IN (${placeholders})
  `, articleIds)

  const vectors = new Map<number, TFIDFVector>()
  for (const row of rows) {
    try {
      vectors.set(row.article_id, JSON.parse(row.tfidf_json))
    } catch {
      console.error(`Failed to parse vector for article ${row.article_id}`)
    }
  }

  return vectors
}
