import { z } from 'zod'

import { prisma } from '../prisma.ts'
import { createTRPCRouter, publicProcedure} from '../trpc'
import { TRPCError } from '@trpc/server'

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
      try {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
      })

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User with id ${input.id} not found`,
        })
      }
      return { user };
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" })
    }
    }),

})
