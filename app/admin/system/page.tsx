import { Activity, Database, ShieldCheck, Wrench } from 'lucide-react'
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
import { rebuildArticleVectors } from './actions'

interface SystemStats {
  articles: number
  vectors: number
  missing_vectors: number
  users: number
  sessions: number
  expired_sessions: number
}

interface MissingVectorArticle {
  id: number
  title: string
  category: string | null
}

export default async function AdminSystemPage() {
  const [statsRows, missingVectors] = await Promise.all([
    query<SystemStats[]>(`
      SELECT
        (SELECT COUNT(*) FROM articles) AS articles,
        (SELECT COUNT(*) FROM article_vectors) AS vectors,
        (SELECT COUNT(*) FROM articles a LEFT JOIN article_vectors av ON av.article_id = a.id WHERE av.article_id IS NULL) AS missing_vectors,
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM sessions) AS sessions,
        (SELECT COUNT(*) FROM sessions WHERE expires_at < NOW()) AS expired_sessions
    `),
    query<MissingVectorArticle[]>(`
      SELECT a.id, a.title, a.category
      FROM articles a
      LEFT JOIN article_vectors av ON av.article_id = a.id
      WHERE av.article_id IS NULL
      ORDER BY a.created_at DESC
      LIMIT 20
    `),
  ])

  const stats = statsRows[0]
  const vectorStatus = stats.missing_vectors === 0 ? 'Healthy' : 'Needs Rebuild'

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
        <p className="text-muted-foreground">
          Check database readiness, session health, and recommendation vector coverage.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database
            </CardTitle>
            <CardDescription>{stats.articles} articles and {stats.users} registered users.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Vectors
            </CardTitle>
            <CardDescription>
              {stats.vectors} stored vectors. {stats.missing_vectors} articles missing vectors.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.missing_vectors === 0 ? 'secondary' : 'destructive'}>{vectorStatus}</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Sessions
            </CardTitle>
            <CardDescription>
              {stats.sessions} stored sessions. {stats.expired_sessions} expired.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance
            </CardTitle>
            <CardDescription>
              Rebuild vectors after bulk imports or major article edits.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={rebuildArticleVectors}>
              <Button type="submit" className="w-full">Rebuild Article Vectors</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Articles Missing Vectors</CardTitle>
            <CardDescription>These articles cannot power recommendations until vectorized.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Article</TableHead>
                  <TableHead>Category</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {missingVectors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground">
                      All articles have vectors.
                    </TableCell>
                  </TableRow>
                ) : (
                  missingVectors.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="max-w-[420px] whitespace-normal font-medium">{article.title}</TableCell>
                      <TableCell>{article.category || 'Uncategorized'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
