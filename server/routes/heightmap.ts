import { Router, type Request, type Response } from 'express'

import { env } from '../lib/env'
import { getHeightmap } from '../lib/heightmapCache'
import { prisma } from '../lib/prisma'
import { supabase } from '../lib/supabase'

export const heightmapRouter: Router = Router()

interface AuthedImage {
  id: string
  userId: string
  filename: string
}

async function authorize(
  req: Request,
  res: Response,
  rawImageId: string,
): Promise<AuthedImage | null> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' })
    return null
  }
  const token = header.slice(7)
  const { data, error } = await supabase.auth.getUser(token)
  if (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return null
  }

  const image = await prisma.rawImage.findFirst({
    where: {
      id: rawImageId,
      OR: [
        { userId: data.user.id },
        { job: { creatorId: data.user.id } },
      ],
    },
    select: { id: true, userId: true, filename: true },
  })
  if (!image) {
    res.status(403).json({ error: 'Forbidden' })
    return null
  }
  return image
}

heightmapRouter.get(
  '/:rawImageId/:channelName',
  (req: Request, res: Response) => {
    const rawImageId = String(req.params.rawImageId)
    const channelName = String(req.params.channelName)
    void (async () => {
      try {
        const image = await authorize(req, res, rawImageId)
        if (!image) return

        const parsed = await getHeightmap(rawImageId)
        const decodedName = decodeURIComponent(channelName)
        const channel = parsed.channels.find((c) => c.name === decodedName)
        if (!channel) {
          res.status(404).json({
            error: `Channel '${decodedName}' not found`,
            available: parsed.channels.map((c) => c.name),
          })
          return
        }

        const buffer = Buffer.from(
          channel.dataNm.buffer,
          channel.dataNm.byteOffset,
          channel.dataNm.byteLength,
        )
        res.setHeader('Content-Type', 'application/octet-stream')
        res.setHeader('Content-Length', String(buffer.byteLength))
        res.setHeader('Cache-Control', 'private, max-age=3600')
        res.setHeader('X-Width', String(channel.width))
        res.setHeader('X-Height', String(channel.height))
        res.end(buffer)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        res.status(500).json({ error: msg })
      }
    })()
  },
)

if (env.NODE_ENV !== 'production') {
  heightmapRouter.get(
    '/:rawImageId/:channelName/debug',
    (req: Request, res: Response) => {
      const rawImageId = String(req.params.rawImageId)
      const channelName = String(req.params.channelName)
      void (async () => {
        try {
          const image = await authorize(req, res, rawImageId)
          if (!image) return

          const parsed = await getHeightmap(rawImageId)
          const decodedName = decodeURIComponent(channelName)
          const channel = parsed.channels.find((c) => c.name === decodedName)

          res.json({
            rawImageId,
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
            requestedChannel: channel
              ? {
                  name: channel.name,
                  unit: channel.unit,
                  width: channel.width,
                  height: channel.height,
                  minValue: channel.minValue,
                  maxValue: channel.maxValue,
                  rms: channel.rms,
                }
              : null,
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          res.status(500).json({ error: msg })
        }
      })()
    },
  )
}
