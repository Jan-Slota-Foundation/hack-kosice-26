import path from 'path'
import { fileURLToPath } from 'url'

import { createExpressMiddleware } from '@trpc/server/adapters/express'
import express from 'express'

import { env } from './lib/env'
import { appRouter } from './router'
import { createContext } from './trpc'

const app = express()

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
)

if (env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const distPath = path.resolve(__dirname, '../dist')

  app.use(express.static(distPath))
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

const PORT = env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${String(PORT)}`)
})
