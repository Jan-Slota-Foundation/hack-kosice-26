import { trpc } from './lib/trpc'

function App() {
  const hello = trpc.example.hello.useQuery({ name: 'tRPC' })

  return (
    <div>
      {hello.isPending && <p>Loading...</p>}
      {hello.data && <p>{hello.data.greeting}</p>}
      {hello.error && <p>Error: {hello.error.message}</p>}
    </div>
  )
}

export default App
