import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@clerk/nextjs/server'
import { tasks } from '@trigger.dev/sdk/v3'
import { processUrlTask } from '@/trigger/process-url'

const f = createUploadthing()

export const ourFileRouter = {
  pdfUploader: f({
    pdf: {
      maxFileSize: '32MB',
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const { userId } = await auth()

      if (!userId) throw new UploadThingError('Unauthorized')

      return { userId }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      const handle = await tasks.trigger<typeof processUrlTask>('process-url', {
        url: file.ufsUrl,
        userId: metadata.userId,
        saveToLibrary: false,
      })

      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        runId: handle.id,
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
