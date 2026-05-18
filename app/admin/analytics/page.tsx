import { BarChart3, Bookmark, Eye, Search } from 'lucide-react'
import { query } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface MetricRow {
  reads_7d: number
  reads_30d: number
  bookmarks_30d: number
  searches_30d: number
}

interface ArticleMetric {
  id: number
  title: string
  category: string | null
  count: number
}

interface SearchMetric {
  query_text: string
  count: number
}

interface CategoryMetric {
  category: string
  read_count: number
}

export default async function AdminAnalyticsPage() {
  const [metricRows, topRead, topBookmarked, topSearches, topCategories] = await Promise.all([
    query<MetricRow[]>(`
      SELECT
        (SELECT COUNT(*) FROM reading_history WHERE read_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)) AS reads_7d,
        (SELECT COUNT(*) FROM reading_history WHERE read_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS reads_30d,
        (SELECT COUNT(*) FROM bookmarks WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS bookmarks_30d,
        (SELECT COUNT(*) FROM search_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) AS searches_30d
    `),
    query<ArticleMetric[]>(`
      SELECT a.id, a.title, a.category, COUNT(rh.id) AS count
      FROM articles a
      JOIN reading_history rh ON rh.article_id = a.id
      GROUP BY a.id, a.title, a.category
      ORDER BY count DESC
      LIMIT 10
    `),
    query<ArticleMetric[]>(`
      SELECT a.id, a.title, a.category, COUNT(b.id) AS count
      FROM articles a
      JOIN bookmarks b ON b.article_id = a.id
      GROUP BY a.id, a.title, a.category
      ORDER BY count DESC
      LIMIT 10
    `),
    query<SearchMetric[]>(`
      SELECT query_text, COUNT(*) AS count
      FROM search_logs
      GROUP BY query_text
      ORDER BY count DESC, MAX(created_at) DESC
      LIMIT 10
    `),
    query<CategoryMetric[]>(`
      SELECT COALESCE(a.category, 'Uncategorized') AS category, COUNT(rh.id) AS read_count
      FROM reading_history rh
      JOIN articles a ON a.id = rh.article_id
      GROUP BY COALESCE(a.category, 'Uncategorized')
      ORDER BY read_count DESC
      LIMIT 8
    `),
  ])

  const metrics = metricRows[0]
  const summaryCards = [
    { label: 'Reads This Week', value: metrics.reads_7d, icon: Eye },
    { label: 'Reads This Month', value: metrics.reads_30d, icon: BarChart3 },
    { label: 'Bookmarks This Month', value: metrics.bookmarks_30d, icon: Bookmark },
    { label: 'Searches This Month', value: metrics.searches_30d, icon: Search },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          See what readers are opening, saving, and searching for.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="gap-1 pb-2">
              <div className="flex items-center justify-between">
                <CardDescription>{card.label}</CardDescription>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">{card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <AnalyticsTable title="Most Read Articles" label="Reads" rows={topRead} />
        <AnalyticsTable title="Most Bookmarked Articles" label="Bookmarks" rows={topBookmarked} />
        <Card>
          <CardHeader>
            <CardTitle>Top Searches</CardTitle>
            <CardDescription>Terms readers use to find content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search Term</TableHead>
                  <TableHead>Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSearches.map((item) => (
                  <TableRow key={item.query_text}>
                    <TableCell className="font-medium">{item.query_text}</TableCell>
                    <TableCell>{item.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Categories with the most reading activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Reads</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topCategories.map((item) => (
                  <TableRow key={item.category}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.read_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AnalyticsTable({
  title,
  label,
  rows,
}: {
  title: string
  label: string
  rows: ArticleMetric[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Ranked by all-time activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>{label}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="max-w-[320px] whitespace-normal font-medium">{row.title}</TableCell>
                <TableCell>{row.category || 'Uncategorized'}</TableCell>
                <TableCell>{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
