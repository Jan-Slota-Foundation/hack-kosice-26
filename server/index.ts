import express from 'express'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { appRouter } from './router'

const app = express()

app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
  }),
)

const PORT = process.env.PORT ?? 3001

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${String(PORT)}`)
})
