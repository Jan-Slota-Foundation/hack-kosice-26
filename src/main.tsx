import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { Providers } from './lib/providers.tsx'

import './index.css'

import App from './App.tsx'

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- root element always exists in index.html
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
)
