import { RouterProvider, type AnyRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

import { useAuth } from './auth-context'

export function InnerApp({ router }: { router: AnyRouter }) {
  const auth = useAuth()

  useEffect(() => {
    void router.invalidate()
  }, [router, auth.isAuthenticated])

  if (auth.isLoading) return null

  return <RouterProvider router={router} context={{ auth }} />
}
