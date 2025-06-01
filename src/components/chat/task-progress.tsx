'use client'

import { useEffect, useState, useRef } from 'react'
import { runs, configure } from '@trigger.dev/sdk/v3'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Loader from '@/components/global/loader'
import { useFileStore } from '@/stores/files-store'

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
  initialStatus,
  onComplete,
}: {
  runId: string
  fileUrl: string
  initialStatus?: string | null
  onComplete?: () => void
}) {
  const [status, setStatus] = useState<string>(initialStatus || 'CREATED')
  const [progress, setProgress] = useState<number>(STATUS_MAPPING[initialStatus || 'CREATED'] || 10)
  const [isComplete, setIsComplete] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const completionHandled = useRef<boolean>(false)
  const router = useRouter()
  const subscriptionRef = useRef<any>(null)
  const { triggerRefresh } = useFileStore()

  configure({
    secretKey: process.env['NEXT_PUBLIC_TRIGGER_SECRET_KEY'] || '',
  })

  useEffect(() => {
    let mounted = true;
    completionHandled.current = false;

    const setupSubscription = async () => {
      try {
        // Get initial state
        const initialRun = await runs.retrieve(runId);
        
        if (!mounted) return;
        
        if (['COMPLETED', 'FAILED', 'CANCELED', 'TIMED_OUT'].includes(initialRun.status)) {
          // Already completed
          handleCompletedRun(initialRun);
          return;
        }
        
        // Set up subscription
        const subscription = runs.subscribeToRun(runId);
        subscriptionRef.current = subscription;
        
        // Listen for updates
        for await (const run of subscription) {
          if (!mounted) break;
          
          console.log('Run update received:', run.status);
          setStatus(run.status);
          setProgress(STATUS_MAPPING[run.status] || progress);
          
          if (['COMPLETED', 'FAILED', 'CANCELED', 'TIMED_OUT'].includes(run.status)) {
            handleCompletedRun(run);
            break;
          }
        }
      } catch (err) {
        console.error('Error in subscription:', err);
        if (mounted) {
          setError('Error tracking processing status');
        }
      }
    };
    
    const handleCompletedRun = (run: any) => {
      if (completionHandled.current) return;
      
      setStatus(run.status);
      setProgress(STATUS_MAPPING[run.status] || 100);
      setIsComplete(true);
      completionHandled.current = true;
      
      if (run.status === 'COMPLETED') {
        // Trigger refresh to update the file list
        triggerRefresh();
        
        toast.success('File processed successfully', {
          action: {
            label: 'View file',
            onClick: () => router.push(`/doc/${encodeURIComponent(fileUrl)}`),
          },
        });
        if (onComplete) {
          setTimeout(onComplete, 2000);
        }
      } else {
        setError(`Processing failed with status: ${run.status}`);
        toast.error(`Processing failed: ${run.status}`);
        if (onComplete) {
          setTimeout(onComplete, 3000);
        }
      }
    };
    
    setupSubscription();
    
    return () => {
      mounted = false;
      // Clean up subscription if it exists
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe?.();
        } catch (e) {
          console.error('Error unsubscribing:', e);
        }
      }
    };
  }, [runId, fileUrl, router, onComplete, progress, triggerRefresh]);

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
