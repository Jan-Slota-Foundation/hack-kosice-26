import { Card, CardContent } from '@/components/ui/card'
import { trpc } from '@/lib/trpc'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/users/')({
  component: UsersIndex,
})

function UsersIndex() {
  const users = trpc.example.getUsers.useQuery()

  if (users.isLoading) return <div className="p-3">Loading...</div>
  if (users.isError) return <div className="p-3">Error loading users</div>

  return (
    <div className="flex flex-col gap-4 p-3">
      {users.data?.users.length === 0 && <div>no users found</div>}
      {users.data?.users.map((user) => (
        <Card key={user.id}>
          <CardContent>
            <div className="flex items-center justify-between">
              <span>{user.name}</span>
              <span className="text-muted-foreground text-xs">{user.id}</span>
              <Link
                to="/users/$userId"
                params={{ userId: user.id.toString() }}
                className="text-sm underline"
              >
                Show Detail
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
