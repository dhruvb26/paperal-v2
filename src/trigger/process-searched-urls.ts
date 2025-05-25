import { task } from '@trigger.dev/sdk/v3'
import { processUrlTask } from '@/trigger/process-url'

interface ProcessSearchedUrlsPayload {
  urls: string[]
  userId: string
}

export const processSearchedUrlsTask = task({
  id: 'process-searched-urls',
  run: async (payload: ProcessSearchedUrlsPayload) => {
    const result = await processUrlTask.batchTriggerAndWait(
      payload.urls.map((url) => ({
        payload: {
          url,
          userId: payload.userId,
          saveToLibrary: true,
        },
      }))
    )

    return result
  },
})
