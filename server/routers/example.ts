import { z } from 'zod'

import { prisma } from '../prisma.ts'
import { createTRPCRouter, publicProcedure } from '../trpc'


export const exampleRouter = createTRPCRouter({
  getUsers: publicProcedure.query(async () => {
    const users = await prisma.user.findMany()
    return { users }
  }),

  removeUsr: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async (opts) => {
      const { input } = opts

      const removedUser = await prisma.user.delete({
        where: {
          id: input.id,
        },
      })

      return { bye: `bye ${removedUser.name}` }
    }),

  getUsrById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const USER = await prisma.user.findUnique({
        where: { id: input.id },
      })

      return { user: USER }
    }),

})
