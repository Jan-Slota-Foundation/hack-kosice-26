import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/users/$userId')({
  component: UserDetail,
})

function UserDetail() {
  const { userId } = Route.useParams()

  const { data, isLoading, isError } = trpc.user.getUserById.useQuery({
    id: userId,
  })
  if (isLoading) return <div className="p-3">Loading...</div>
  if (isError) return <div className="p-3">Error loading user</div>

  return <div className="p-3">Hello {data?.user.name}!</div>
}
