import type { AuthState } from '@/lib/auth-context'
import {
  createRootRouteWithContext,
  Link,
  Outlet,
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

  return (
    <>
      {!auth.isAuthenticated && (
        <>
          <div className="flex items-center gap-3 p-2">
            <Link to="/" className="[&.active]:font-bold">
              Home
            </Link>
            <Link to="/login" className="ml-auto [&.active]:font-bold">
              Login
            </Link>
            <Link to="/signup" className="[&.active]:font-bold">
              Signup
            </Link>
          </div>
          <hr />
        </>
      )}
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}
