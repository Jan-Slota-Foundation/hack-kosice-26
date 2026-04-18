import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const analysisJobsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        imageCount: z.number().int().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const job = await prisma.analysisJob.create({
        data: {
          name: input.name,
          creatorId: ctx.user.id,
        },
        select: { id: true },
      })
      return { jobId: job.id }
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const jobs = await prisma.analysisJob.findMany({
      where: { creatorId: ctx.user.id },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { images: true } } },
    })
    return { jobs }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const job = await prisma.analysisJob.findFirst({
        where: { id: input.id, creatorId: ctx.user.id },
        include: {
          images: { orderBy: { createdAt: 'asc' } },
          creator: { select: { email: true, name: true } },
        },
      })
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Analysis job not found`,
        })
      }
      return { job }
    }),

  markFinished: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.analysisJob.updateMany({
        where: { id: input.id, creatorId: ctx.user.id },
        data: {
          status: 'FINISHED',
          finishedAt: new Date(),
          error: null,
        },
      })
      if (result.count === 0) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return { ok: true }
    }),

  markError: protectedProcedure
    .input(z.object({ id: z.uuid(), message: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const result = await prisma.analysisJob.updateMany({
        where: { id: input.id, creatorId: ctx.user.id },
        data: {
          status: 'ERROR',
          finishedAt: new Date(),
          error: input.message,
        },
      })
      if (result.count === 0) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }
      return { ok: true }
    }),
})
