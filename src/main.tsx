import { createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from './lib/providers.tsx'
import { routeTree } from './routeTree.gen'

import './index.css'

import App from './App.tsx'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <RouterProvider router={router} />

      <App />
    </Providers>
  </StrictMode>,
)
