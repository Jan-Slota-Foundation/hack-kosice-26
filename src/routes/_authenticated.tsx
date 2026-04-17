import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router idiom: throw redirect() is how route guards navigate
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
  component: Outlet,
})
