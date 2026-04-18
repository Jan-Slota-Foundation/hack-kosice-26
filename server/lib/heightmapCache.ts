import { LRUCache } from 'lru-cache'

import { parseBruker, type BrukerParsed } from './bruker'
import { prisma } from './prisma'
import { supabaseAdmin } from './supabase'

const BUCKET = 'bytemaps'

const cache = new LRUCache<string, BrukerParsed>({
  max: 20,
  fetchMethod: async (rawImageId) => {
    const row = await prisma.rawImage.findUnique({
      where: { id: rawImageId },
      select: { storagePath: true },
    })
    if (!row) {
      throw new Error(`RawImage ${rawImageId} not found`)
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(row.storagePath)
    if (error) {
      throw new Error(
        `Failed to download raw image ${rawImageId} from storage: ${error.message}`,
      )
    }

    const arrayBuffer = await data.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    try {
      return parseBruker(bytes)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`Failed to parse Bruker file for ${rawImageId}: ${msg}`)
    }
  },
})

export async function getHeightmap(rawImageId: string): Promise<BrukerParsed> {
  const value = await cache.fetch(rawImageId)
  if (!value) {
    throw new Error(`Failed to load heightmap for ${rawImageId}`)
  }
  return value
}
