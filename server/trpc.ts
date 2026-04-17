import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'
import superjson from 'superjson'

import { prisma } from './lib/prisma'
import { supabase } from './lib/supabase'

export const createContext = async ({ req }: CreateExpressContextOptions) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return { prisma, user: null }
  const token = header.slice(7)

  const { data, error } = await supabase.auth.getUser(token)
  if (error) return { prisma, user: null }

  const supabaseUser = data.user
  const email = supabaseUser.email ?? ''
  const metadataName: unknown = supabaseUser.user_metadata.name
  const name = typeof metadataName === 'string' ? metadataName : email

  const user = await prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: { email },
    create: { id: supabaseUser.id, email, name },
  })

  return { prisma, user }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
