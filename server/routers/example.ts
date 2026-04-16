import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
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
    .mutation(async ({ input }) => {
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
        const user = await prisma.user.findUniqueOrThrow({
          where: { id: input.id },
        })

        return { user }
      } catch (e) {
        // Prisma "record not found"
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `User with id ${input.id.toString()} not found`,
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unexpected error while fetching user',
          cause: e,
        })
      }
    }),

  createUser: publicProcedure
    .input(z.object({ email: z.email(), name: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const newUser = await prisma.user.create({
          data: {
            email: input.email,
            name: input.name,
          },
        })

        return { newUser }
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'A user with this email already exists',
          })
        }

        throw e
      }
    }),
})
