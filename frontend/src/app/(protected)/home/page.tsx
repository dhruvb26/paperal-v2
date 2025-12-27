'use client'

import { useState } from 'react'
import CreateDocButton from '@/components/user/create-doc-button'
import UploadPdfButton from '@/components/user/upload-pdf-button'
import TaskProgress from '@/components/chat/task-progress'

export default function HomePage() {
  const [uploading, setUploading] = useState(false)
  const [runId, setRunId] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)

  const resetTask = () => {
    setUploading(false)
    setRunId(null)
    setFileUrl(null)
  }

  return (
    <div className="flex flex-col h-full items-center justify-center gap-6">
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold">Welcome to Paperal</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="text-muted-foreground flex flex-row items-center justify-center gap-2">
          Get started by creating a new document
          <CreateDocButton />
          or upload one
          <UploadPdfButton
            setUploading={setUploading}
            setRunId={setRunId}
            setFileUrl={setFileUrl}
          />
        </div>
        <div className="flex flex-row items-center justify-center gap-2">
          {uploading && runId && fileUrl && (
            <TaskProgress
              runId={runId}
              fileUrl={fileUrl}
              onComplete={resetTask}
            />
          )}
        </div>
      </div>
    </div>
  )
}
