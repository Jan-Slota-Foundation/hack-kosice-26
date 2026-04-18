import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { prisma } from '../lib/prisma.ts'
import { supabaseAdmin } from '../lib/supabase.ts'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const bytemapRouter = createTRPCRouter({
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

  uploadRaw: protectedProcedure
    .input(
      z.object({
        filename: z
          .string()
          .min(1)
          .refine((name) => name.toLowerCase().endsWith('.bmp'), {
            message: 'Only .bmp files are accepted',
          }),
        contentType: z.string().default('image/bmp'),
        data: z.instanceof(Uint8Array),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      // raw/userID/date
      const path = `raw/${ctx.user.id}/${Date.now().toString()}-${safeName}`

      const { data, error } = await supabaseAdmin.storage
        .from('bytemaps')
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

      return { path: data.path }
    }),
})
