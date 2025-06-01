import { createUploadthing, type FileRouter } from 'uploadthing/next'
import { UploadThingError } from 'uploadthing/server'
import { auth } from '@clerk/nextjs/server'
import { runs, tasks } from '@trigger.dev/sdk/v3'
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
      console.log('Upload complete', file.ufsUrl)
      const handle = await tasks.trigger<typeof processUrlTask>('process-url', {
        url: file.ufsUrl,
        userId: metadata.userId,
        saveToLibrary: false,
      })
      
      // Get initial run state
      const initialRun = await runs.retrieve(handle.id)
      
      return {
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        runId: handle.id,
        initialStatus: initialRun.status
      }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
