'use client'
import { createDocument } from '@/actions/document'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useDocumentStore } from '@/stores/document-store'

export default function CreateDocButton() {
  const router = useRouter()
  const [userPrompt, setUserPrompt] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const addDocument = useDocumentStore((state) => state.addDocument)

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await createDocument(userPrompt)
    setIsLoading(false)

    if ('error' in result) {
      return toast.error(result.error.message)
    }

    const { id, title, prompt, content, userId } = result.value

    addDocument({
      id,
      title,
      prompt,
      content,
      userId,
    })

    setIsOpen(false)
    setUserPrompt('')
    toast.success('Document created successfully')
    router.push(`/editor/${id}`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent" variant="ghost" size="icon">
          <Plus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
          <DialogDescription>
            Enter a prompt to create a new document.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreateDocument} className="space-y-4">
          <Input
            placeholder="What do you want to write about?"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end">
            <Button
              className="bg-[color:var(--custom)] hover:bg-[color:var(--custom)]/80"
              type="submit"
              isLoading={isLoading}
            >
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
