import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { supabaseAdmin } from '../lib/supabase.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const BUCKET = 'bytemaps'
const SIGNED_URL_TTL_SECONDS = 3600

async function signPaths(paths: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()

  if (paths.length === 0) return map

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message,
    })
  }

  for (const entry of data) {
    if (entry.path && entry.signedUrl) {
      map.set(entry.path, entry.signedUrl)
    }
  }
  return map
}

export const analysisJobsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
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

      const signed = await signPaths(job.images.map((img) => img.storagePath))
      const images = job.images.map((img) => ({
        ...img,
        downloadUrl: signed.get(img.storagePath) ?? null,
      }))

      return { job: { ...job, images } }
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

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input, ctx }) => {
      const job = await prisma.analysisJob.findFirst({
        where: { id: input.id, creatorId: ctx.user.id },
        include: { images: { select: { storagePath: true } } },
      })
      if (!job) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const paths = job.images.map((img) => img.storagePath)
      if (paths.length > 0) {
        const { error } = await supabaseAdmin.storage
          .from(BUCKET)
          .remove(paths)
        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }
      }

      await prisma.analysisJob.delete({ where: { id: job.id } })
      return { ok: true }
    }),
})
