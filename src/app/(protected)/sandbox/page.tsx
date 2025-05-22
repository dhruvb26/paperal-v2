'use client'
import Loader from '@/components/global/loader'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState } from 'react'
import UploadPdfButton from '@/components/user/upload-pdf-button'

export default function Sandbox() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <Button isLoading={isLoading}>Loading</Button>
      <UploadPdfButton />
      <Button
        isLoading={isLoading}
        onClick={() => toast.error('This is an error toast')}
      >
        Error
      </Button>
      <Button onClick={() => toast.warning('This is a warning toast')}>
        Warning
      </Button>
      <Button onClick={() => toast.success('This is a success toast')}>
        Success
      </Button>
      <Button onClick={() => toast.loading('This is a loading toast')}>
        Loading
      </Button>
      <Button onClick={() => setIsLoading(true)}>
        <Loader />
      </Button>
    </div>
  )
}
