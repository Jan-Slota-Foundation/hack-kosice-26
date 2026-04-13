import { trpc } from './lib/trpc'

function App() {
  const users = trpc.example.getUsers.useQuery()
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
    <div>
      {users.data && (
        <div>
          {users.data.users.length === 0 && <div>no users found</div>}
          {users.data.users.map((user) => (
            <div key={user.id}>
              {user.name}
              {user.id}
              <button
                onClick={() => {
                  removeUser.mutate({ id: user.id })
                }}
                disabled={
                  removeUser.isPending && removeUser.variables.id === user.id
                }
                className="rounded bg-amber-500 p-1 disabled:opacity-50"
              >
                {removeUser.isPending && removeUser.variables.id === user.id
                  ? 'Removing...'
                  : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App
