import type { TFIDFVector } from './tfidf'

/**
 * Calculate cosine similarity between two TF-IDF vectors
 * 
 * Cosine similarity measures the cosine of the angle between two vectors.
 * Values range from 0 (completely different) to 1 (identical).
 * 
 * Formula: cos(θ) = (A · B) / (||A|| * ||B||)
 * 
 * Since our vectors are already normalized, we just need the dot product.
 */
export function cosineSimilarity(
  vectorA: TFIDFVector,
  vectorB: TFIDFVector,
): number {
  let dotProduct = 0

  // Only iterate over terms that exist in vectorA
  // (terms only in vectorB contribute 0 to the dot product)
  for (const term of Object.keys(vectorA)) {
    if (term in vectorB) {
      dotProduct += vectorA[term] * vectorB[term]
    }
  }

  return dotProduct
}

/**
 * Find the most similar articles to a target article
 * 
 * @param targetVector - The TF-IDF vector of the article to find recommendations for
 * @param candidateVectors - Map of article IDs to their TF-IDF vectors
 * @param excludeIds - Article IDs to exclude from results (e.g., the target article itself)
 * @param limit - Maximum number of recommendations to return
 * @returns Array of [articleId, similarityScore] tuples, sorted by similarity descending
 */
export function findMostSimilar(
  targetVector: TFIDFVector,
  candidateVectors: Map<number, TFIDFVector>,
  excludeIds: Set<number> = new Set(),
  limit: number = 5,
): Array<[number, number]> {
  const similarities: Array<[number, number]> = []

  for (const [articleId, candidateVector] of candidateVectors) {
    if (excludeIds.has(articleId)) continue

    const similarity = cosineSimilarity(targetVector, candidateVector)
    similarities.push([articleId, similarity])
  }

  // Sort by similarity descending and take top N
  return similarities
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
}

/**
 * Calculate a weighted average of multiple TF-IDF vectors
 * Used for creating a "user preference vector" from reading history
 * 
 * @param vectors - Array of TF-IDF vectors
 * @param weights - Optional weights for each vector (defaults to equal weights)
 * @returns Combined TF-IDF vector representing the weighted average
 */
export function weightedAverageVector(
  vectors: TFIDFVector[],
  weights?: number[],
): TFIDFVector {
  if (vectors.length === 0) return {}

  // Default to equal weights
  const actualWeights = weights || vectors.map(() => 1 / vectors.length)

  // Normalize weights to sum to 1
  const weightSum = actualWeights.reduce((sum, w) => sum + w, 0)
  const normalizedWeights = actualWeights.map(w => w / weightSum)

  const combined: TFIDFVector = {}

  for (let i = 0; i < vectors.length; i++) {
    const vector = vectors[i]
    const weight = normalizedWeights[i]

    for (const [term, value] of Object.entries(vector)) {
      combined[term] = (combined[term] || 0) + value * weight
    }
  }

  // Normalize the combined vector
  const magnitude = Math.sqrt(
    Object.values(combined).reduce((sum, val) => sum + val * val, 0)
  )

  if (magnitude === 0) return combined

  const normalized: TFIDFVector = {}
  for (const [term, value] of Object.entries(combined)) {
    normalized[term] = value / magnitude
  }

  return normalized
}

/**
 * Calculate similarity scores for all articles against a preference vector
 * Returns scores sorted by similarity
 */
export function rankByPreference(
  preferenceVector: TFIDFVector,
  articleVectors: Map<number, TFIDFVector>,
  excludeIds: Set<number> = new Set(),
): Array<{ articleId: number; score: number }> {
  const scores: Array<{ articleId: number; score: number }> = []

  for (const [articleId, vector] of articleVectors) {
    if (excludeIds.has(articleId)) continue

    const score = cosineSimilarity(preferenceVector, vector)
    scores.push({ articleId, score })
  }

  return scores.sort((a, b) => b.score - a.score)
}
