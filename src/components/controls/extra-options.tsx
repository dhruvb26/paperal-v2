'use client'
import { DotsThreeIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSubTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import {
  Trash2,
  Image as ImageIcon,
  ArrowDownToLine,
  FileText,
  FileCode,
  FileType,
  Clock,
} from 'lucide-react'
import type { Editor } from '@tiptap/core'
import { uploadImage } from '@/backend/actions/upload'

export default function ExtraOptions({ editor }: { editor: Editor }) {
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const file = event.target.files?.[0]

      if (!file) {
        console.error('No file selected')
        return
      }

      const imageUrl = URL.createObjectURL(file)
      await uploadImage(file)
      editor.chain().focus().setImage({ src: imageUrl, alt: file.name }).run()

      event.target.value = ''
    } catch (error) {
      console.error('Error in image upload:', error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <DotsThreeIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={8} align="start">
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <label
            htmlFor="image-upload"
            className="flex items-center gap-2 w-full cursor-pointer"
          >
            <ImageIcon size={16} />
            Image
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleImageUpload(e)
              }}
            />
          </label>
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Clock size={16} />
          Version History
        </DropdownMenuItem>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <div className="flex items-center gap-2">
              <ArrowDownToLine size={16} />
              Export
            </div>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <FileType size={16} />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText size={16} />
                HTML
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileCode size={16} />
                LaTex
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 size={16} />
          <span>Delete File</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
