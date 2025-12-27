'use server'

import { db } from '@/db'
import { chunksTable } from '@/db/schema'
import { tryCatch } from '@/utils/try-catch'
import { eq } from 'drizzle-orm'
import { Chunk } from '@/types/chunk'
import { getNamespace } from '@/utils/tools'

export const createChunks = async (chunks: Chunk[]) => {
  const chunksToInsert = chunks.map((chunk) => ({
    id: chunk.id,
    namespace: chunk.namespace,
    text: chunk.text,
    bbox: chunk.bbox,
  }))

  const { data, error } = await tryCatch(
    db.insert(chunksTable).values(chunksToInsert)
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const getChunks = async (url: string) => {
  const namespace = await getNamespace(url)

  const { data, error } = await tryCatch(
    db.select().from(chunksTable).where(eq(chunksTable.namespace, namespace))
  )

  if (error) {
    throw new Error(error.message)
  }

  return data as Chunk[]
}
