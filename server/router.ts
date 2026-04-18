import { bytemapRouter } from './routers/bytemaps'
import { exampleRouter } from './routers/example'
import { createTRPCRouter } from './trpc'

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  bytemaps: bytemapRouter,
})

export type AppRouter = typeof appRouter
