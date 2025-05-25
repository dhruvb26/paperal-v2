'use client'

import { useEffect, useState, useCallback } from 'react'
import { getDocuments, deleteDocument } from '@/backend/actions/document'
import { getFiles, deleteFile } from '@/backend/actions/file'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { FilePen, FileText, MoreVertical, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDocumentStore } from '@/stores/document-store'
import { useFileStore } from '@/stores/files-store'
import Loader from '@/components/global/loader'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export default function UserDocList() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Document store
  const { documents, setDocuments, removeDocument } = useDocumentStore()

  // File store
  const { files, setFiles, removeFile, refreshCounter } = useFileStore()

  const fetchData = useCallback(async () => {
    setIsLoading(true)

    // Fetch both documents and files
    const [docsResult, filesResult] = await Promise.all([
      getDocuments(),
      getFiles(),
    ])

    setIsLoading(false)

    if (!('error' in docsResult)) {
      setDocuments(docsResult.value)
    } else {
      toast.error('Failed to fetch documents')
    }

    setFiles(filesResult)
  }, [setDocuments, setFiles])

  const handleDocDelete = async (id: string) => {
    const result = await deleteDocument(id)

    if ('error' in result) {
      toast.error(result.error.message)
      return
    }

    removeDocument(id)
    toast.success('Document deleted successfully')

    if (pathname.split('/').pop() === id) {
      router.push('/home')
    }
  }

  const handleFileDelete = async (id: string, url: string) => {
    await deleteFile(id, url)
    removeFile(id)
    toast.success('File deleted successfully')

    if (pathname.split('/').pop() === id) {
      router.push('/home')
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchData, refreshCounter])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <>
      {/* Documents List */}
      {documents.map((doc) => (
        <SidebarMenuItem key={`doc-${doc.id}`}>
          <div className="flex items-center justify-between w-full">
            <SidebarMenuButton
              onClick={() => router.push(`/editor/${doc.id}`)}
              asChild
              className="hover:cursor-pointer flex-1"
            >
              <span>
                <FilePen size={18} className="stroke-2" />
                <span className="font-medium truncate">{doc.title}</span>
              </span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  <MoreVertical
                    className="text-muted-foreground stroke-1"
                    size={16}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem
                  onClick={() => handleDocDelete(doc.id)}
                  variant="destructive"
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Delete Document</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      ))}

      {/* Files List */}
      {files.map((file) => (
        <SidebarMenuItem key={`file-${file.id}`}>
          <div className="flex items-center justify-between w-full">
            <SidebarMenuButton
              onClick={() =>
                router.push(`/doc/${encodeURIComponent(file.fileUrl)}`)
              }
              asChild
              className="hover:cursor-pointer flex-1"
            >
              <span>
                <FileText size={18} className="stroke-[1.5]" />
                <span className="font-medium truncate">{file.title}</span>
              </span>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 hover:opacity-100 transition-opacity"
                >
                  <MoreVertical
                    className="text-muted-foreground stroke-1"
                    size={16}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8}>
                <DropdownMenuItem
                  onClick={() => handleFileDelete(file.id, file.fileUrl)}
                  variant="destructive"
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 hover:cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Delete File</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SidebarMenuItem>
      ))}
    </>
  )
}
