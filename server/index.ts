import { createExpressMiddleware } from '@trpc/server/adapters/express'
import express from 'express'

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

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${String(PORT)}`)
})
