import { Toaster } from '@/components/ui/sonner'
import type { AuthState } from '@/lib/auth-context'
import { InnerApp } from '@/lib/inner-app'
import { createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from './lib/providers.tsx'
import { routeTree } from './routeTree.gen'

import './index.css'

console.log(
  `[build] ${__COMMIT_HASH__} "${__COMMIT_MESSAGE__}" built=${__BUILD_TIME__}`,
)

const initialAuth: AuthState = {
  session: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  signIn: () => Promise.resolve({ error: null }),
  signUp: () =>
    Promise.resolve({ error: null, needsEmailConfirmation: false }),
  signOut: () => Promise.resolve(),
}

const router = createRouter({
  routeTree,
  context: { auth: initialAuth },
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <InnerApp router={router} />
      <Toaster />
    </Providers>
  </StrictMode>,
)
