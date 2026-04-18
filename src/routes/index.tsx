import { useAuth } from '@/lib/auth-context'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const auth = useAuth()

  return (
    <div className="flex flex-col gap-3 p-3">
      <h1 className="text-xl font-semibold">hack-kosice-26</h1>
      {auth.isAuthenticated ? (
        <p>
          Signed in as <span className="font-medium">{auth.user?.email}</span>.
          Go to{' '}
          <Link to="/users" className="underline">
            users
          </Link>{' '}
          or{' '}
          <Link to="/upload" className="underline">
            upload
          </Link>
          .
        </p>
      ) : (
        <p>
          <Link to="/login" className="underline">
            Log in
          </Link>{' '}
          or{' '}
          <Link to="/signup" className="underline">
            sign up
          </Link>{' '}
          to continue.
        </p>
      )}
    </div>
  )
}
