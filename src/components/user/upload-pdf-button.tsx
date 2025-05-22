'use client'

import { UploadButton } from '@/utils/uploadthing'
import { ArrowUpFromLine } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Loader from '@/components/global/loader'

export default function UploadPdfButton() {
  const router = useRouter()
  return (
    <UploadButton
      content={{
        button: ({ ready }) => {
          if (ready)
            return (
              <div className="flex items-center text-foreground">
                <ArrowUpFromLine size={16} />
              </div>
            )
          return (
            <div>
              <Loader />
            </div>
          )
        },
      }}
      endpoint="pdfUploader"
      className="ut-button:bg-accent ut-button:hover:bg-accent ut-button:size-7 ut-button:ut-uploading:bg-accent ut-button:ut-uploading:after:bg-accent/50 ut-button:text-sm ut-button:font-normal ut-button:px-3 ut-button:py-1 ut-button:outline-none ut-button:ring-0 ut-button:focus:ring-0 ut-allowed-content:hidden ut-button:focus-visible:ring-0"
      onClientUploadComplete={(res) => {
        toast.success('Uploaded successfully')
        router.push(`/doc/${encodeURIComponent(res[0].ufsUrl)}`)
      }}
      onUploadError={(error: Error) => {
        toast.error(`ERROR! ${error.message}`)
      }}
    />
  )
}
