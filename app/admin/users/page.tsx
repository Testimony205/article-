import { ShieldCheck, UserRound } from 'lucide-react'
import { query } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
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
import { setUserRole } from './actions'

interface UserRow {
  id: number
  email: string
  name: string | null
  role: 'user' | 'admin'
  created_at: Date
  read_count: number
  bookmarks: number
}

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser()
  const users = await query<UserRow[]>(`
    SELECT
      u.id,
      u.email,
      u.name,
      u.role,
      u.created_at,
      COUNT(DISTINCT rh.id) AS read_count,
      COUNT(DISTINCT b.id) AS bookmarks
    FROM users u
    LEFT JOIN reading_history rh ON rh.user_id = u.id
    LEFT JOIN bookmarks b ON b.user_id = u.id
    GROUP BY u.id, u.email, u.name, u.role, u.created_at
    ORDER BY u.created_at DESC
    LIMIT 100
  `)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Users & Access</h1>
        <p className="text-muted-foreground">
          Promote trusted accounts to admin or remove admin access when needed.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Readers
            </CardTitle>
            <CardDescription>
              Can browse, search, read, bookmark, and receive recommendations.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admins
            </CardTitle>
            <CardDescription>
              Can manage content, view analytics, manage roles, and rebuild vectors.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>Role changes take effect the next time the header refreshes.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Reads</TableHead>
                <TableHead>Bookmarks</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="whitespace-normal">
                    <div className="font-medium">{user.name || user.email.split('@')[0]}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.read_count}</TableCell>
                  <TableCell>{user.bookmarks}</TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {user.role === 'admin' ? (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="user" />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          disabled={currentUser?.id === user.id}
                        >
                          Make User
                        </Button>
                      </form>
                    ) : (
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="role" value="admin" />
                        <Button type="submit" size="sm" variant="outline">
                          Make Admin
                        </Button>
                      </form>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
