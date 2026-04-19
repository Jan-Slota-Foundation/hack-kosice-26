import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { supabaseAdmin } from '../lib/supabase.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const BUCKET = 'bytemaps'

export const bytemapRouter = createTRPCRouter({
  uploadRawToJob: protectedProcedure
    .input(
      z.object({
        jobId: z.uuid(),
        filename: z.string().min(1),
        contentType: z.string().default('application/octet-stream'),
        data: z.instanceof(Uint8Array),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const job = await prisma.analysisJob.findFirst({
        where: { id: input.jobId, creatorId: ctx.user.id },
        select: { id: true, patientId: true },
      })
      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Analysis job not found',
        })
      }

      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `raw/${job.patientId}/${Date.now().toString()}-${safeName}`

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, input.data, {
          contentType: input.contentType,
          upsert: false,
        })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to upload ${input.filename}: ${error.message}`,
          cause: error,
        })
      }

      const image = await prisma.rawImage.create({
        data: {
          filename: input.filename,
          contentType: input.contentType,
          storagePath: data.path,
          sizeBytes: input.data.byteLength,
          userId: job.patientId,
          jobId: input.jobId,
        },
        select: { id: true, storagePath: true },
      })

      return { imageId: image.id, path: image.storagePath }
    }),

  getSignedUrl: protectedProcedure
    .input(z.object({ path: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const image = await prisma.rawImage.findFirst({
        where: {
          storagePath: input.path,
          OR: [
            { userId: ctx.user.id },
            { job: { creatorId: ctx.user.id } },
          ],
        },
        select: { id: true },
      })
      if (!image) {
        throw new TRPCError({ code: 'NOT_FOUND' })
      }

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUrl(input.path, 3600)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }
      return { url: data.signedUrl }
    }),
})
