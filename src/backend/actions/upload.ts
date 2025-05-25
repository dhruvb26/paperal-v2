'use server'

import { utapi } from '@/server/uploadthing'

export async function uploadImage(file: File) {
  const { data, error } = await utapi.uploadFiles(file)

  if (error) {
    throw new Error(error.message)
  }

  return data
}
