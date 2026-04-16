import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { userId } = Route.useParams()

  const { data, isLoading, isError } = trpc.example.getUsrById.useQuery({
    id: Number(userId),
  })
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error loading user</div>

  return <div>Hello {data?.user.name}!</div>
}
