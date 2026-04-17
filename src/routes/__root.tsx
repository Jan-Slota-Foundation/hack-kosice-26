import { Button } from '@/components/ui/button'
import type { AuthState } from '@/lib/auth-context'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  useRouter,
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export interface RouterContext {
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})

function RootLayout() {
  const { auth } = Route.useRouteContext()
  const router = useRouter()

  const handleSignOut = async () => {
    await auth.signOut()
    await router.invalidate()
    await router.navigate({ to: '/login' })
  }

  return (
    <>
      <div className="flex items-center gap-3 p-2">
        <Link to="/" className="[&.active]:font-bold">
          Home
        </Link>
        {auth.isAuthenticated ? (
          <>
            <Link to="/users" className="[&.active]:font-bold">
              Users
            </Link>
            <span className="text-muted-foreground ml-auto text-sm">
              {auth.user?.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleSignOut()}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Link to="/login" className="ml-auto [&.active]:font-bold">
              Login
            </Link>
            <Link to="/signup" className="[&.active]:font-bold">
              Signup
            </Link>
          </>
        )}
      </div>
      <hr />
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}
