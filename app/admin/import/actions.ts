'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { DEFAULT_RSS_SOURCES, importArticlesFromRss } from '@/lib/rss-importer'

export async function importRssArticles(formData: FormData) {
  const user = await getCurrentUser()

  if (!user || !isAdmin(user)) {
    throw new Error('Only admins can import articles')
  }

  const sourceValue = String(formData.get('source') || '')
  const rawCustomFeedUrl = String(formData.get('customFeedUrl') || '').trim()
  const customFeedUrl = rawCustomFeedUrl === 'https://example.com/feed' ? '' : rawCustomFeedUrl
  const keyword = String(formData.get('keyword') || '').trim()
  const categoryInput = String(formData.get('category') || '').trim()
  const limit = Number(formData.get('limit') || 10)

  const selectedSource = DEFAULT_RSS_SOURCES.find((source) => source.url === sourceValue)
  const feedUrl = customFeedUrl || selectedSource?.url

  if (!feedUrl) {
    redirect('/admin/import?error=missing-feed')
  }

  let result

  try {
    result = await importArticlesFromRss({
      feedUrl,
      sourceName: selectedSource?.name || new URL(feedUrl).hostname,
      category: categoryInput || selectedSource?.category || 'Imported',
      keyword,
      limit,
      userId: user.id,
    })
  } catch (error) {
    console.error('RSS import failed:', error)
    const message = error instanceof Error ? error.message : 'Import failed'
    redirect(`/admin/import?error=${encodeURIComponent(`Import failed: ${message}`)}`)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/articles')
  revalidatePath('/admin/import')
  revalidatePath('/articles')

  redirect(`/admin/import?imported=${result.imported}&skipped=${result.skipped}&source=${encodeURIComponent(result.sourceName)}`)
}
