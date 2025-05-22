import CreateDocButton from '@/components/user/create-doc-button'
import UploadPdfButton from '@/components/user/upload-pdf-button'

export default async function HomePage() {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-6">
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold">Welcome to Paperal</span>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-row items-center justify-center gap-2">
          <span className="text-muted-foreground">
            Get started by creating a new document
          </span>
          <CreateDocButton />
        </div>
        <div className="flex flex-row text-muted-foreground items-center justify-center gap-2">
          <div className="h-[2px] w-36 bg-muted" />
          or
          <div className="h-[2px] w-36 bg-muted" />
        </div>
        <div className="flex flex-row items-center justify-center gap-2">
          <span className="text-muted-foreground">Upload a PDF</span>
          <UploadPdfButton />
        </div>
      </div>
    </div>
  )
}
