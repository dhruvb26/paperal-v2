'use server'

import { tryCatch } from '@/utils/try-catch'
import { chunksTable, filesTable } from '@/db/schema'
import { db } from '@/db'
import { File, PageDimensions } from '@/types/file'
import { auth } from '@clerk/nextjs/server'
import { and, eq } from 'drizzle-orm'
import { Pinecone } from '@pinecone-database/pinecone'

const validateUser = async () => {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

// auth is done in the uploadThing middleware
export const addFileToDb = async (
  userId: string,
  url: string,
  title: string,
  description: string,
  namespace: string,
  pageDimensions: PageDimensions,
  taskId: string
) => {
  const { data, error } = await tryCatch(
    db
      .insert(filesTable)
      .values({
        userId,
        namespace,
        title,
        description,
        fileUrl: url,
        pageDimensions,
        taskId,
      })
      .returning()
  )

  if (error) {
    throw new Error(error.message)
  }

  return data[0] as File
}

export const getFile = async (url: string) => {
  const { data, error } = await tryCatch(
    db.select().from(filesTable).where(eq(filesTable.fileUrl, url))
  )

  if (error) {
    throw new Error(error.message)
  }

  return data[0] as File
}

export const getFiles = async () => {
  const userId = await validateUser()

  const { data, error } = await tryCatch(
    db.select().from(filesTable).where(eq(filesTable.userId, userId))
  )

  if (error) {
    throw new Error(error.message)
  }

  return data as File[]
}

export const deleteFile = async (id: string, url: string) => {
  const userId = await validateUser()

  const file = await getFile(url)
  const namespace = file.namespace

  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const index = pc.index('paperal')

  await index.deleteNamespace(namespace)

  const { data, error } = await tryCatch(
    db
      .delete(filesTable)
      .where(and(eq(filesTable.id, id), eq(filesTable.userId, userId)))
  )

  if (error) {
    throw new Error(error.message)
  }

  const { error: chunksError } = await tryCatch(
    db.delete(chunksTable).where(eq(chunksTable.namespace, namespace))
  )

  if (chunksError) {
    throw new Error(chunksError.message)
  }

  return data
}
