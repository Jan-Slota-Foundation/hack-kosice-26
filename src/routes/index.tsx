import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  // FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input.tsx'
import { trpc } from '@/lib/trpc'
import { createFileRoute } from '@tanstack/react-router'
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
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input name="email" required />
                </Field>

                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input name="name" required />
                </Field>
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
      if (context?.previous) {
        utils.example.getUsers.setData(undefined, context.previous)
      }
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
      <AddUserCard></AddUserCard>
      {users.data && (
        <div>
          {users.data.users.length === 0 && <div>no users found</div>}
          {users.data.users.map((user) => (
            <div key={user.id}>
              {user.name}
              {user.id}
              <RemoveUserButton userId={user.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
