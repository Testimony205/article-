// TF-IDF (Term Frequency - Inverse Document Frequency) Implementation
// This is the core algorithm for content-based recommendations

// Common English stop words to filter out
const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'done', 'for', 'from', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'just', 'me', 'might', 'more',
  'most', 'must', 'my', 'no', 'nor', 'not', 'now', 'of', 'on', 'only', 'or',
  'other', 'our', 'ours', 'out', 'over', 'own', 's', 'same', 'she', 'should',
  'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when',
  'where', 'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'would',
  'you', 'your', 'yours', 'yourself', 'yourselves', 'll', 've', 're', 'd', 'm',
])

export type TFIDFVector = Record<string, number>

/**
 * Tokenize and clean text:
 * - Convert to lowercase
 * - Remove punctuation
 * - Split into words
 * - Remove stop words
 * - Remove short words (less than 2 chars)
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word))
}

/**
 * Calculate term frequency (TF) for a document
 * TF = (number of times term appears in document) / (total terms in document)
 */
export function calculateTF(tokens: string[]): Record<string, number> {
  const termCounts: Record<string, number> = {}
  const totalTerms = tokens.length

  for (const term of tokens) {
    termCounts[term] = (termCounts[term] || 0) + 1
  }

  const tf: Record<string, number> = {}
  for (const [term, count] of Object.entries(termCounts)) {
    tf[term] = count / totalTerms
  }

  return tf
}

/**
 * Calculate inverse document frequency (IDF) across all documents
 * IDF = log(total documents / documents containing term)
 */
export function calculateIDF(
  documents: string[][],
): Record<string, number> {
  const documentCount = documents.length
  const termDocumentCounts: Record<string, number> = {}

  // Count how many documents contain each term
  for (const tokens of documents) {
    const uniqueTerms = new Set(tokens)
    for (const term of uniqueTerms) {
      termDocumentCounts[term] = (termDocumentCounts[term] || 0) + 1
    }
  }

  // Calculate IDF with smoothing to avoid division by zero
  const idf: Record<string, number> = {}
  for (const [term, docCount] of Object.entries(termDocumentCounts)) {
    // Add 1 to both numerator and denominator for smoothing
    idf[term] = Math.log((documentCount + 1) / (docCount + 1)) + 1
  }

  return idf
}

/**
 * Calculate TF-IDF vector for a single document given the IDF values
 */
export function calculateTFIDF(
  tokens: string[],
  idf: Record<string, number>,
): TFIDFVector {
  const tf = calculateTF(tokens)
  const tfidf: TFIDFVector = {}

  for (const [term, tfValue] of Object.entries(tf)) {
    const idfValue = idf[term] || Math.log(2) + 1 // Default IDF for unknown terms
    tfidf[term] = tfValue * idfValue
  }

  return tfidf
}

/**
 * Normalize a vector to unit length (for cosine similarity)
 */
export function normalizeVector(vector: TFIDFVector): TFIDFVector {
  const magnitude = Math.sqrt(
    Object.values(vector).reduce((sum, val) => sum + val * val, 0)
  )

  if (magnitude === 0) return vector

  const normalized: TFIDFVector = {}
  for (const [term, value] of Object.entries(vector)) {
    normalized[term] = value / magnitude
  }

  return normalized
}

/**
 * Get top N keywords from a TF-IDF vector
 */
export function getTopKeywords(vector: TFIDFVector, n: number = 10): string[] {
  return Object.entries(vector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([term]) => term)
}

/**
 * Main class for managing TF-IDF computations across a corpus
 */
export class TFIDFVectorizer {
  private idf: Record<string, number> = {}
  private documents: string[][] = []

  /**
   * Fit the vectorizer on a corpus of documents
   * This calculates the IDF values
   */
  fit(texts: string[]): void {
    this.documents = texts.map(tokenize)
    this.idf = calculateIDF(this.documents)
  }

  /**
   * Transform a single text into a TF-IDF vector
   */
  transform(text: string): TFIDFVector {
    const tokens = tokenize(text)
    const tfidf = calculateTFIDF(tokens, this.idf)
    return normalizeVector(tfidf)
  }

  /**
   * Fit and transform in one step
   */
  fitTransform(texts: string[]): TFIDFVector[] {
    this.fit(texts)
    return texts.map(text => this.transform(text))
  }

  /**
   * Get the current IDF values
   */
  getIDF(): Record<string, number> {
    return { ...this.idf }
  }

  /**
   * Set IDF values (for loading from database)
   */
  setIDF(idf: Record<string, number>): void {
    this.idf = { ...idf }
  }
}
