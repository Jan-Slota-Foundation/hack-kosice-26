import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const exampleRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(async () => {
    const users = await prisma.user.findMany()
    return { users }
  }),

  getUsrById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input }) => {
      try {
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: input.id },
        })

        return { user }
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with id ${input.id} not found`,
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected error while fetching user',
          cause: e,
        })
      }
    }),
})
