import Link from 'next/link'
import { Download, ExternalLink, Rss } from 'lucide-react'
import { DEFAULT_RSS_SOURCES } from '@/lib/rss-importer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { importRssArticles } from './actions'

export default async function AdminImportPage({
  searchParams,
}: {
  searchParams: Promise<{ imported?: string; skipped?: string; source?: string; error?: string }>
}) {
  const params = await searchParams
  const imported = Number(params.imported || 0)
  const skipped = Number(params.skipped || 0)
  const source = params.source ? decodeURIComponent(params.source) : ''

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Articles</h1>
          <p className="text-muted-foreground">
            Pull article previews from online RSS feeds, save them locally, and rebuild recommendation vectors.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/articles">
            View Articles
          </Link>
        </Button>
      </div>

      {(params.imported || params.error) && (
        <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm">
          {params.error === 'missing-feed' ? (
            <p className="text-destructive">Choose a source or paste a custom RSS feed URL.</p>
          ) : params.error ? (
            <p className="text-destructive">{params.error}</p>
          ) : (
            <p>
              Imported <strong>{imported}</strong> article previews from <strong>{source}</strong>.
              {skipped > 0 && <> Skipped <strong>{skipped}</strong> duplicates or keyword mismatches.</>}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rss className="h-5 w-5" />
              RSS Import
            </CardTitle>
            <CardDescription>
              Choose a source, optionally filter by keyword, and import up to 25 items at a time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={importRssArticles} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select name="source" defaultValue={DEFAULT_RSS_SOURCES[0]?.url}>
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Choose a source" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_RSS_SOURCES.map((sourceOption) => (
                      <SelectItem key={sourceOption.url} value={sourceOption.url}>
                        {sourceOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customFeedUrl">Custom RSS URL</Label>
                <Input
                  id="customFeedUrl"
                  name="customFeedUrl"
                  placeholder="https://example.com/feed"
                  type="url"
                  defaultValue=""
                />
                <p className="text-xs text-muted-foreground">
                  If filled, this overrides the selected source.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="Wellness" />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="keyword">Keyword filter</Label>
                  <Input id="keyword" name="keyword" placeholder="habits" />
                </div>
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="limit">Limit</Label>
                  <Input id="limit" name="limit" type="number" min="1" max="25" defaultValue="10" />
                </div>
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Import Articles
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              The importer fills your local database so search and recommendations stay fast.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">1. Fetch online RSS items</p>
              <p>Titles, summaries, images, authors, dates, and source links are pulled from the feed.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">2. Save article previews</p>
              <p>The app stores previews and links to original sources instead of copying full articles.</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="font-medium text-foreground">3. Rebuild vectors</p>
              <p>TF-IDF vectors are rebuilt so related articles and For You recommendations include imports.</p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <a href="https://rss.com/blog/popular-rss-feeds/" target="_blank" rel="noreferrer">
                Find RSS feeds
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
