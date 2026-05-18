import { query } from './db'
import { recomputeAllVectors } from './vectorizer'

export const DEFAULT_RSS_SOURCES = [
  {
    name: 'Tiny Buddha',
    url: 'https://tinybuddha.com/feed/',
    category: 'Mindfulness',
  },
  {
    name: 'Mark Manson',
    url: 'https://markmanson.net/feed',
    category: 'Personal Growth',
  },
  {
    name: 'James Clear',
    url: 'https://jamesclear.com/feed',
    category: 'Productivity',
  },
  {
    name: 'BBC Good Food',
    url: 'https://www.bbcgoodfood.com/recipes/feed',
    category: 'Food',
  },
  {
    name: 'NASA',
    url: 'https://www.nasa.gov/news-release/feed/',
    category: 'Science',
  },
  {
    name: 'BBC Science',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'Science',
  },
  {
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    category: 'Technology',
  },
  {
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'Technology',
  },
  {
    name: 'Smashing Magazine',
    url: 'https://www.smashingmagazine.com/feed/',
    category: 'Design',
  },
  {
    name: 'ArchDaily',
    url: 'https://feeds.feedburner.com/Archdaily',
    category: 'Architecture',
  },
  {
    name: 'Dezeen',
    url: 'https://www.dezeen.com/feed/',
    category: 'Architecture',
  },
  {
    name: 'Designboom',
    url: 'https://www.designboom.com/feed/',
    category: 'Architecture',
  },
  {
    name: 'Architectural Record',
    url: 'https://www.architecturalrecord.com/rss/articles',
    category: 'Architecture',
  },
  {
    name: 'NYTimes Health',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml',
    category: 'Health',
  },
]

interface FeedArticle {
  title: string
  link: string
  excerpt: string
  content: string
  author: string | null
  publishedAt: Date | null
  imageUrl: string | null
}

export interface ImportArticlesInput {
  feedUrl: string
  sourceName: string
  category: string
  keyword?: string
  limit: number
  userId: number | null
  requireReadableContent?: boolean
}

export interface ImportArticlesResult {
  imported: number
  skipped: number
  sourceName: string
}

export interface AutoImportArticlesResult {
  imported: number
  skipped: number
  searchedSources: number
}

export async function importArticlesFromRss(input: ImportArticlesInput): Promise<ImportArticlesResult> {
  const feedUrl = input.feedUrl.trim()
  const sourceName = input.sourceName.trim() || new URL(feedUrl).hostname
  const category = input.category.trim() || 'Imported'
  const keyword = input.keyword?.trim().toLowerCase()
  const limit = Math.min(Math.max(input.limit, 1), 25)

  const articles = await fetchFeedArticles(feedUrl)
  let imported = 0
  let skipped = 0

  for (const article of articles) {
    if (imported >= limit) break

    const searchableText = `${article.title} ${article.excerpt}`.toLowerCase()
    if (keyword && !searchableText.includes(keyword)) {
      skipped++
      continue
    }

    const existing = await query<Array<{ id: number }>>(`
      SELECT id
      FROM articles
      WHERE source_url = ? OR title = ?
      LIMIT 1
    `, [article.link, article.title])

    if (existing.length > 0) {
      skipped++
      continue
    }

    const body = buildImportedArticleBody(article)
    const contentQuality = getContentQuality(body)
    if (input.requireReadableContent && contentQuality !== 'full') {
      skipped++
      continue
    }
    const slug = await createUniqueSlug(article.title)
    const readingTime = Math.max(1, Math.ceil(body.split(/\s+/).length / 200))
    const tags = JSON.stringify([category, sourceName, 'imported'])

    await query(`
      INSERT INTO articles (
        user_id,
        title,
        slug,
        body,
        excerpt,
        author,
        category,
        tags,
        image_url,
        source_url,
        source_name,
        imported_at,
        content_quality,
        reading_time,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
    `, [
      input.userId,
      article.title,
      slug,
      body,
      article.excerpt || null,
      article.author || sourceName,
      category,
      tags,
      article.imageUrl,
      article.link,
      sourceName,
      contentQuality,
      readingTime,
      article.publishedAt || new Date(),
    ])

    imported++
  }

  if (imported > 0) {
    await recomputeAllVectors()
  }

  return {
    imported,
    skipped,
    sourceName,
  }
}

export async function autoImportArticlesForSearch(
  keyword: string,
  limit: number = 8,
  options: { includeNewsFallback?: boolean; requireReadableContent?: boolean } = {}
): Promise<AutoImportArticlesResult> {
  const normalizedKeyword = keyword.trim()
  const includeNewsFallback = options.includeNewsFallback ?? true
  const requireReadableContent = options.requireReadableContent ?? true

  if (normalizedKeyword.length < 3) {
    return {
      imported: 0,
      skipped: 0,
      searchedSources: 0,
    }
  }

  let imported = 0
  let skipped = 0
  let searchedSources = 0
  const perSourceLimit = Math.max(1, Math.ceil(limit / 4))
  const sources = [
    ...DEFAULT_RSS_SOURCES,
    {
      name: 'Google News',
      url: buildGoogleNewsSearchFeedUrl(normalizedKeyword),
      category: inferCategoryFromKeyword(normalizedKeyword),
    },
  ]

  for (const source of sources.filter((source) => source.name !== 'Google News')) {
    if (imported >= limit) break

    try {
      const result = await importArticlesFromRss({
        feedUrl: source.url,
        sourceName: source.name,
        category: source.category,
        keyword: source.name === 'Google News' ? undefined : normalizedKeyword,
        limit: Math.min(perSourceLimit, limit - imported),
        userId: null,
        requireReadableContent,
      })

      imported += result.imported
      skipped += result.skipped
      searchedSources++
    } catch (error) {
      console.error(`Auto-import failed for ${source.name}:`, error)
      searchedSources++
    }
  }

  if (imported === 0 && includeNewsFallback) {
    const googleNewsSource = sources.find((source) => source.name === 'Google News')

    if (googleNewsSource) {
      try {
        const result = await importArticlesFromRss({
          feedUrl: googleNewsSource.url,
          sourceName: googleNewsSource.name,
          category: googleNewsSource.category,
          keyword: undefined,
          limit,
          userId: null,
          requireReadableContent: false,
        })

        imported += result.imported
        skipped += result.skipped
        searchedSources++
      } catch (error) {
        console.error(`Auto-import failed for ${googleNewsSource.name}:`, error)
        searchedSources++
      }
    }
  }

  return {
    imported,
    skipped,
    searchedSources,
  }
}

function buildGoogleNewsSearchFeedUrl(keyword: string): string {
  const query = encodeURIComponent(keyword)
  return `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`
}

function inferCategoryFromKeyword(keyword: string): string {
  const lowerKeyword = keyword.toLowerCase()
  const categoryTerms: Array<{ category: string; terms: string[] }> = [
    {
      category: 'Architecture',
      terms: ['building', 'buildings', 'architecture', 'architect', 'construction', 'house', 'housing', 'interior', 'skyscraper', 'urban design'],
    },
    {
      category: 'Fashion',
      terms: ['cloth', 'clothes', 'clothing', 'fashion', 'style', 'outfit', 'dress', 'met gala', 'runway', 'designer'],
    },
    {
      category: 'Sports',
      terms: ['football', 'soccer', 'sports', 'basketball', 'tennis', 'fifa', 'premier league', 'champions league', 'nba', 'olympics'],
    },
    {
      category: 'Politics',
      terms: ['politics', 'election', 'government', 'president', 'senate', 'parliament', 'trump', 'putin', 'biden', 'prime minister'],
    },
    {
      category: 'Transport',
      terms: ['ship', 'ships', 'car', 'cars', 'vehicle', 'automobile', 'tesla', 'plane', 'aviation', 'train', 'transport'],
    },
    {
      category: 'Entertainment',
      terms: ['anime', 'cartoon', 'movie', 'movies', 'film', 'cinema', 'celebrity', 'music', 'met gala', 'social life', 'sociallife'],
    },
    {
      category: 'Health',
      terms: ['health', 'wellness', 'fitness', 'medicine', 'medical', 'doctor', 'hospital', 'mental health', 'virus', 'outbreak', 'outbreaks', 'pandemic', 'disease'],
    },
    {
      category: 'Technology',
      terms: ['technology', 'tech', 'software', 'ai', 'robot', 'startup', 'app', 'elon musk', 'musk', 'spacex', 'neuralink'],
    },
    {
      category: 'History',
      terms: ['history', 'ancient', 'empire', 'war history', 'historical', 'archive', 'civilization'],
    },
    {
      category: 'Science',
      terms: ['science', 'space', 'physics', 'biology', 'climate', 'research', 'planet', 'nasa', 'astronomy', 'chemistry'],
    },
    {
      category: 'Law',
      terms: ['law', 'legal', 'court', 'judge', 'lawsuit', 'supreme court', 'constitution', 'rights'],
    },
    {
      category: 'Finance',
      terms: ['finance', 'financial', 'money', 'stock', 'stocks', 'market', 'bank', 'banking', 'investment', 'investing'],
    },
    {
      category: 'Crypto',
      terms: ['crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'nft'],
    },
    {
      category: 'Africa',
      terms: ['nigeria', 'ghana', 'lagos', 'abuja', 'accra', 'africa', 'african'],
    },
    {
      category: 'World',
      terms: ['canada', 'usa', 'america', 'uk', 'russia', 'china', 'india', 'europe', 'world'],
    },
    {
      category: 'Animals',
      terms: ['animal', 'animals', 'wildlife', 'dog', 'cat', 'bird', 'lion', 'elephant', 'conservation'],
    },
    {
      category: 'Food',
      terms: ['food', 'recipe', 'chicken', 'rice', 'cooking', 'meal', 'restaurant', 'nutrition'],
    },
  ]

  for (const { category, terms } of categoryTerms) {
    if (terms.some((term) => lowerKeyword.includes(term))) {
      return category
    }
  }

  return 'News'
}

async function fetchFeedArticles(feedUrl: string): Promise<FeedArticle[]> {
  const response = await fetch(feedUrl, {
    headers: {
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
      'User-Agent': 'InspireArticleImporter/1.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Feed request failed with status ${response.status}`)
  }

  const xml = await response.text()
  const itemBlocks = getBlocks(xml, 'item')
  const entryBlocks = itemBlocks.length > 0 ? [] : getBlocks(xml, 'entry')
  const blocks = itemBlocks.length > 0 ? itemBlocks : entryBlocks

  return blocks
    .map((block) => parseFeedBlock(block, itemBlocks.length > 0 ? 'rss' : 'atom'))
    .filter((article): article is FeedArticle => Boolean(article?.title && article.link))
}

function parseFeedBlock(block: string, type: 'rss' | 'atom'): FeedArticle | null {
  const title = cleanText(getTagValue(block, 'title'))
  const link = type === 'atom'
    ? cleanText(getAtomLink(block))
    : cleanText(getTagValue(block, 'link'))
  const excerpt = cleanText(
    getTagValue(block, 'description') ||
      getTagValue(block, 'summary') ||
      getTagValue(block, 'content:encoded') ||
      getTagValue(block, 'content')
  )
  const content = cleanText(
    getTagValue(block, 'content:encoded') ||
      getTagValue(block, 'content') ||
      getTagValue(block, 'description') ||
      getTagValue(block, 'summary')
  )
  const author = cleanText(getTagValue(block, 'dc:creator') || getTagValue(block, 'author') || getTagValue(block, 'name')) || null
  const dateText = cleanText(getTagValue(block, 'pubDate') || getTagValue(block, 'published') || getTagValue(block, 'updated'))
  const publishedAt = dateText ? new Date(dateText) : null
  const imageUrl = getImageUrl(block)

  if (!title || !link) return null

  return {
    title,
    link,
    excerpt: excerpt || title,
    content: content || excerpt || title,
    author,
    publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    imageUrl,
  }
}

function getBlocks(xml: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  return Array.from(xml.matchAll(regex)).map((match) => match[1])
}

function getTagValue(block: string, tag: string): string {
  const escapedTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`<${escapedTag}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i')
  return block.match(regex)?.[1] || ''
}

function getAtomLink(block: string): string {
  const alternate = block.match(/<link\b[^>]*rel=["']alternate["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  const first = block.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  return alternate?.[1] || first?.[1] || ''
}

function getImageUrl(block: string): string | null {
  const media = block.match(/<media:content\b[^>]*url=["']([^"']+)["'][^>]*>/i)
  const thumbnail = block.match(/<media:thumbnail\b[^>]*url=["']([^"']+)["'][^>]*>/i)
  const enclosure = block.match(/<enclosure\b[^>]*url=["']([^"']+)["'][^>]*type=["']image\/[^"']+["'][^>]*>/i)
  return media?.[1] || thumbnail?.[1] || enclosure?.[1] || null
}

function cleanText(value: string): string {
  return stripHtml(decodeEntities(value))
    .replace(/\s+/g, ' ')
    .trim()
}

function stripHtml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
}

function decodeEntities(value: string): string {
  const entities: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  }

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#x')) {
      return String.fromCharCode(parseInt(entity.slice(2), 16))
    }

    if (entity.startsWith('#')) {
      return String.fromCharCode(parseInt(entity.slice(1), 10))
    }

    return entities[entity.toLowerCase()] || match
  })
}

function buildImportedArticleBody(article: FeedArticle): string {
  const content = article.content || article.excerpt || article.title
  const paragraphs = splitIntoParagraphs(content).slice(0, 12)

  return [
    ...paragraphs.map(escapeHtml),
    '',
    `Continue reading: ${escapeHtml(article.link)}`,
  ].join('\n\n')
}

function getContentQuality(body: string): 'full' | 'preview' {
  const wordCount = body.split(/\s+/).filter(Boolean).length
  return wordCount >= 180 ? 'full' : 'preview'
}

function splitIntoParagraphs(value: string): string[] {
  const sentences = value
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)

  if (sentences.length <= 3) {
    return [value.trim()].filter(Boolean)
  }

  const paragraphs: string[] = []
  for (let index = 0; index < sentences.length; index += 3) {
    paragraphs.push(sentences.slice(index, index + 3).join(' '))
  }

  return paragraphs
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function createUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'imported-article'

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).substring(2, 7)
    const slug = `${base}-${suffix}`
    const existing = await query<Array<{ id: number }>>(
      `SELECT id FROM articles WHERE slug = ? LIMIT 1`,
      [slug]
    )

    if (existing.length === 0) return slug
  }

  return `${base}-${Date.now()}`
}
