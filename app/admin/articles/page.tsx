import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Download, Plus } from 'lucide-react'
import { query } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'
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

interface AdminArticleRow {
  id: number
  title: string
  slug: string
  category: string | null
  author: string | null
  created_at: Date
  has_vector: 0 | 1
}

export default async function AdminArticlesPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/login?redirect=/admin/articles')
  }

  if (!isAdmin(user)) {
    redirect('/articles')
  }

  const articles = await query<AdminArticleRow[]>(`
    SELECT
      a.id,
      a.title,
      a.slug,
      a.category,
      a.author,
      a.created_at,
      CASE WHEN av.article_id IS NULL THEN 0 ELSE 1 END AS has_vector
    FROM articles a
    LEFT JOIN article_vectors av ON av.article_id = a.id
    ORDER BY a.created_at DESC
    LIMIT 50
  `)

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Articles</h1>
            <p className="text-muted-foreground">
              Manage curated articles used by search and recommendations.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link href="/upload" className="gap-2">
                <Plus className="h-4 w-4" />
                New Article
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/import" className="gap-2">
                <Download className="h-4 w-4" />
                Import
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Articles</CardTitle>
            <CardDescription>
              Articles should have vectors so related and personalized recommendations can use them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Vector</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="max-w-[360px] whitespace-normal font-medium">
                      <Link href={`/articles/${article.slug}`} className="hover:underline">
                        {article.title}
                      </Link>
                    </TableCell>
                    <TableCell>{article.category || 'Uncategorized'}</TableCell>
                    <TableCell>{article.author || 'Unknown'}</TableCell>
                    <TableCell>{article.has_vector ? 'Ready' : 'Missing'}</TableCell>
                    <TableCell>{new Date(article.created_at).toLocaleDateString()}</TableCell>
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
