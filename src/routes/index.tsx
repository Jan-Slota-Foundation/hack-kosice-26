import { InputField } from '@/components/input-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { trpc } from '@/lib/trpc'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import z from 'zod'

export const Route = createFileRoute('/')({
  component: Index,
})

const formSchema = z.object({
  email: z.email(),
  name: z.string(),
})

function AddUserCard() {
  const utils = trpc.useUtils()

  const createUser = trpc.example.createUser.useMutation({
    onMutate: async () => {
      await utils.example.getUsers.cancel()
    },

    onSuccess: () => {
      toast.success('Successfully created user')
    },

    onError: (error) => {
      toast.error(error.message)
    },

    onSettled: () => {
      void utils.example.getUsers.invalidate()
    },
  })

  const handleAddUserSubmit: React.SubmitEventHandler<HTMLFormElement> = (
    event,
  ) => {
    event.preventDefault()

    const data = formSchema.parse(
      Object.fromEntries(new FormData(event.currentTarget)),
    )

    createUser.mutate(data)
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleAddUserSubmit}>
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Add a new user</FieldLegend>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Email" name="email" required />
                <InputField label="Name" name="name" required />
              </div>
              <Button type="submit">Add User</Button>
            </FieldSet>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

function RemoveUserButton({ userId }: { userId: number }) {
  const utils = trpc.useUtils()
  const removeUser = trpc.example.removeUsr.useMutation({
    onMutate: async ({ id }) => {
      await utils.example.getUsers.cancel()
      const previous = utils.example.getUsers.getData()
      utils.example.getUsers.setData(undefined, (old) =>
        old ? { users: old.users.filter((u) => u.id !== id) } : old,
      )
      return { previous }
    },

    onError: (_err, _input, context) => {
      // Rollback of optimistic
      if (context?.previous) {
        utils.example.getUsers.setData(undefined, context.previous)
      }
    },

    onSuccess: () => {
      toast.success('Successfully removed user')
    },

    onSettled: () => {
      void utils.example.getUsers.invalidate()
    },
  })

  return (
    <Button
      onClick={() => {
        removeUser.mutate({ id: userId })
      }}
      disabled={removeUser.isPending}
    >
      {removeUser.isPending && 'Removing...'}
      {!removeUser.isPending && 'Remove'}
    </Button>
  )
}

function Index() {
  const users = trpc.example.getUsers.useQuery()

  return (
    <div className="p-3">
      <AddUserCard />
      {users.data && (
        <div className="flex flex-col gap-4">
          {users.data.users.length === 0 && <div>no users found</div>}

          {users.data.users.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <div className="flex items-center justify-between">
                  {user.name}
                  {user.id}
                  <div className="flex items-center gap-2">
                    <Link
                      to="/users/$userId"
                      params={{ userId: user.id.toString() }}
                    >
                      Show Detail
                    </Link>
                    <RemoveUserButton userId={user.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
