'use client'

import { useEffect, useState } from 'react'
import { getDocuments, deleteDocument } from '@/actions/document'
import { SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import { FileText, MoreVertical, Trash2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDocumentStore } from '@/stores/document-store'
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
  const { documents, setDocuments, removeDocument } = useDocumentStore()

  const fetchDocuments = async () => {
    setIsLoading(true)
    const result = await getDocuments()
    setIsLoading(false)

    if ('error' in result) {
      toast.error(result.error.message)
      return
    }

    setDocuments(result.value)
  }

  const handleDelete = async (id: string) => {
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

  useEffect(() => {
    fetchDocuments()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader />
      </div>
    )
  }

  return (
    <>
      {documents.map((doc) => (
        <SidebarMenuItem key={doc.id}>
          <div className="flex items-center justify-between w-full">
            <SidebarMenuButton
              onClick={() => router.push(`/editor/${doc.id}`)}
              asChild
              className="hover:cursor-pointer flex-1"
            >
              <span>
                <FileText size={18} className="stroke-[1.5]" />
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
                  onClick={() => handleDelete(doc.id)}
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
