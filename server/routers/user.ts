import { Prisma, UserRole } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const userRouter = createTRPCRouter({
  getUsers: protectedProcedure.query(async () => {
    const users = await prisma.user.findMany()
    return { users }
  }),

  getUserById: protectedProcedure
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

  listPatientsByDoctorId: protectedProcedure
    .input(z.object({ doctorId: z.uuid() }))
    .query(async ({ input }) => {
      const patients = await prisma.user.findMany({
        where: { doctorId: input.doctorId, role: UserRole.PATIENT },
        orderBy: { name: 'asc' },
      })
      return { patients }
    }),
})
