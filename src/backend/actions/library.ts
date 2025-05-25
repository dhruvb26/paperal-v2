'use server '

import { db } from '@/db'
import { libraryTable } from '@/db/schema'

export async function addToLibrary(
  title: string,
  description: string,
  metadata: any,
  userId?: string
) {
  const result = await db.insert(libraryTable).values({
    userId: userId || null,
    title,
    description,
    metadata,
  })

  return result[0]
}
