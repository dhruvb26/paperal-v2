'use client'
import { Editor } from '@tiptap/core'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function TextControls({ editor }: { editor: Editor }) {
  const getCurrentStyle = () => {
    if (editor.isActive('heading', { level: 1 })) return 'Title'
    if (editor.isActive('heading', { level: 2 })) return 'Header'
    if (editor.isActive('heading', { level: 3 })) return 'Subtitle'
    return 'Normal Text'
  }

  const onStyleChange = (value: string) => {
    switch (value) {
      case 'Normal Text':
        editor.chain().focus().setParagraph().run()
        break
      case 'Title':
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        break
      case 'Header':
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        break
      case 'Subtitle':
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        break
    }
  }

  return (
    <Select value={getCurrentStyle()} onValueChange={onStyleChange}>
      <SelectTrigger className="w-fit shadow-none border-none">
        <SelectValue placeholder="Select a style">
          <span className="text-sm font-medium">
            {getCurrentStyle()
              .split('-')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="Normal Text">
            <span className="text-xs">Normal Text</span>
          </SelectItem>
          <SelectItem value="Title">
            <span className="text-lg">Title</span>
          </SelectItem>
          <SelectItem value="Header">
            <span className="text-base">Header</span>
          </SelectItem>
          <SelectItem value="Subtitle">
            <span className="text-sm">Subtitle</span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
