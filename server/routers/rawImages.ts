import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { getHeightmap } from '../lib/heightmapCache'
import { prisma } from '../lib/prisma'
import { createTRPCRouter, protectedProcedure } from '../trpc'

export const rawImagesRouter = createTRPCRouter({
  getHeightmapMeta: protectedProcedure
    .input(z.object({ rawImageId: z.uuid() }))
    .query(async ({ input, ctx }) => {
      const image = await prisma.rawImage.findFirst({
        where: { id: input.rawImageId, userId: ctx.user.id },
        select: { id: true, filename: true },
      })
      if (!image) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Raw image not found',
        })
      }

      let parsed
      try {
        parsed = await getHeightmap(input.rawImageId)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: msg,
        })
      }

      return {
        rawImageId: image.id,
        filename: image.filename,
        scanSizeNm: parsed.scanSizeNm,
        pixelSizeNm: parsed.pixelSizeNm,
        scanDate: parsed.scanDate,
        instrumentDescription: parsed.instrumentDescription,
        channels: parsed.channels.map((c) => ({
          name: c.name,
          width: c.width,
          height: c.height,
          unit: c.unit,
          minValue: c.minValue,
          maxValue: c.maxValue,
          rms: c.rms,
        })),
      }
    }),
})
