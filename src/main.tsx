import { Toaster } from '@/components/ui/sonner'
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

const router = createRouter({
  routeTree,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- filled in by <RouterProvider context={} /> before use
  context: { auth: undefined! },
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
