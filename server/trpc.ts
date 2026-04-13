import { initTRPC } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import superjson from 'superjson'

import { prisma } from './prisma'

// TODO: remove the comment upon adding options
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const createContext = (_opts: CreateExpressContextOptions) => ({
  prisma,
})

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
