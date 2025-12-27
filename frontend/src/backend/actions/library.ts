'use server '

import { db } from '@/db'
import { libraryTable } from '@/db/schema'

interface LibraryItemMetadata {
  title: string
  file_url: string
  authors: string[]
  citations: {
    'in-text': string
  }
  year: string
}

export async function addToLibrary(
  title: string,
  description: string,
  metadata: LibraryItemMetadata,
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
