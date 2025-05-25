'use client'

import { useEffect, useState, useRef } from 'react'
import { runs, configure } from '@trigger.dev/sdk/v3'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Loader from '@/components/global/loader'

const POLL_INTERVAL = 1500
const STATUS_MAPPING: Record<string, number> = {
  CREATED: 10,
  QUEUED: 20,
  RUNNING: 40,
  EXECUTING: 60,
  COMPLETED: 100,
  FAILED: 100,
  CANCELED: 100,
  TIMED_OUT: 100,
}

export default function TaskProgress({
  runId,
  fileUrl,
  onComplete,
}: {
  runId: string
  fileUrl: string
  onComplete?: () => void
}) {
  const [status, setStatus] = useState<string>('CREATED')
  const [progress, setProgress] = useState<number>(10)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [executingCounter, setExecutingCounter] = useState<number>(0)
  const completionHandled = useRef<boolean>(false)
  const router = useRouter()

  configure({
    secretKey: process.env['NEXT_PUBLIC_TRIGGER_SECRET_KEY'] || '',
  })

  useEffect(() => {
    let mounted = true

    const pollTaskStatus = async () => {
      try {
        const run = await runs.retrieve(runId)

        if (!mounted) return

        setStatus(run.status)

        if (run.status === 'EXECUTING') {
          setExecutingCounter((prev) => prev + 1)
          const incrementalProgress = Math.min(95, 60 + executingCounter * 2)
          setProgress(incrementalProgress)
        } else {
          setProgress(STATUS_MAPPING[run.status] || progress)
        }

        if (
          ['COMPLETED', 'FAILED', 'CANCELED', 'TIMED_OUT'].includes(
            run.status
          ) &&
          !completionHandled.current
        ) {
          clearInterval(intervalId)
          setIsComplete(true)
          completionHandled.current = true

          if (run.status === 'COMPLETED') {
            toast.success('File processed successfully', {
              action: {
                label: 'View file',
                onClick: () =>
                  router.push(`/doc/${encodeURIComponent(fileUrl)}`),
              },
            })
            if (onComplete) {
              setTimeout(onComplete, 2000)
            }
          } else {
            setError(`Processing failed with status: ${run.status}`)
            toast.error(`Processing failed: ${run.status}`)
            if (onComplete) {
              setTimeout(onComplete, 3000)
            }
          }
        }
      } catch (err) {
        console.error('Error polling task status:', err)
        if (!mounted) return
        setError('Error retrieving task status')
      }
    }

    const intervalId = setInterval(pollTaskStatus, POLL_INTERVAL)
    pollTaskStatus() // Initial call

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [runId, fileUrl, router, executingCounter, progress, onComplete])

  return (
    <div className="flex flex-col gap-4 w-full max-w-md items-center">
      <div className="flex items-center gap-2">
        {!isComplete && <Loader />}
        <p className="text-sm text-muted-foreground">
          {status === 'COMPLETED'
            ? 'Processing complete!'
            : status === 'FAILED' ||
                status === 'CANCELED' ||
                status === 'TIMED_OUT'
              ? `Processing ${status.toLowerCase()}`
              : 'Processing your document'}
        </p>
      </div>

      <Progress value={progress} className="h-2 w-full" />

      <p className="text-xs text-muted-foreground">
        {status === 'CREATED' && 'Initializing task'}
        {status === 'QUEUED' && 'Waiting in queue'}
        {status === 'RUNNING' && 'Processing document'}
        {status === 'EXECUTING' && 'Analyzing content'}
        {status === 'COMPLETED' && 'Successfully processed!'}
        {(status === 'FAILED' ||
          status === 'CANCELED' ||
          status === 'TIMED_OUT') &&
          error}
      </p>
    </div>
  )
}
