import Link from 'next/link'
import { Activity, BookOpen, Bookmark, Download, Eye, Search, ShieldCheck, Users } from 'lucide-react'
import { query } from '@/lib/db'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface DashboardStats {
  articles: number
  vectors: number
  users: number
  admins: number
  read_count: number
  bookmarks: number
  searches: number
}

interface PopularArticle {
  id: number
  title: string
  slug: string
  read_count: number
  bookmarks: number
}

export default async function AdminDashboardPage() {
  const [statsRows, popularArticles] = await Promise.all([
    query<DashboardStats[]>(`
      SELECT
        (SELECT COUNT(*) FROM articles) AS articles,
        (SELECT COUNT(*) FROM article_vectors) AS vectors,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
        (SELECT COUNT(*) FROM reading_history) AS read_count,
        (SELECT COUNT(*) FROM bookmarks) AS bookmarks,
        (SELECT COUNT(*) FROM search_logs) AS searches
    `),
    query<PopularArticle[]>(`
      SELECT
        a.id,
        a.title,
        a.slug,
        COUNT(DISTINCT rh.id) AS read_count,
        COUNT(DISTINCT b.id) AS bookmarks
      FROM articles a
      LEFT JOIN reading_history rh ON rh.article_id = a.id
      LEFT JOIN bookmarks b ON b.article_id = a.id
      GROUP BY a.id, a.title, a.slug
      ORDER BY read_count DESC, bookmarks DESC, a.created_at DESC
      LIMIT 5
    `),
  ])

  const stats = statsRows[0]
  const vectorCoverage = stats.articles > 0 ? Math.round((stats.vectors / stats.articles) * 100) : 0

  const cards = [
    { label: 'Articles', value: stats.articles, icon: BookOpen },
    { label: 'Vector Coverage', value: `${vectorCoverage}%`, icon: Activity },
    { label: 'Reads', value: stats.read_count, icon: Eye },
    { label: 'Bookmarks', value: stats.bookmarks, icon: Bookmark },
    { label: 'Searches', value: stats.searches, icon: Search },
    { label: 'Admins', value: stats.admins, icon: ShieldCheck },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Control articles, access, recommendations, and site health from one place.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/import">
            <Download className="h-4 w-4" />
            Import Articles
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => (
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top Articles</CardTitle>
            <CardDescription>Most-read and most-saved content in the library.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Reads</TableHead>
                  <TableHead>Bookmarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularArticles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="max-w-[420px] whitespace-normal font-medium">
                      <Link href={`/articles/${article.slug}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell>{article.read_count}</TableCell>
                    <TableCell>{article.bookmarks}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
            <CardDescription>Current admin permissions for this version.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {['Create curated articles', 'View analytics', 'Manage user roles', 'Rebuild recommendation vectors'].map((item) => (
              <div key={item} className="flex items-center justify-between gap-3 rounded-md border p-3">
                <span className="text-sm">{item}</span>
                <Badge variant="secondary">Admin</Badge>
              </div>
            ))}
            <div className="pt-2">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/admin/import">
                    <Download className="h-4 w-4" />
                    Import Online Articles
                  </Link>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/admin/users">
                    <Users className="h-4 w-4" />
                    Manage Access
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
