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
import {
  ListBulletsIcon,
  ListChecksIcon,
  ListNumbersIcon,
} from '@phosphor-icons/react'
import { ReactNode } from 'react'

type ListStyle = 'bullet-list' | 'ordered-list' | 'task-list'

const listOptions: {
  value: ListStyle
  icon: ReactNode
  label: string
  shortcut: string
}[] = [
  {
    value: 'bullet-list',
    icon: <ListBulletsIcon className="size-4" />,
    label: 'Bullet List',
    shortcut: '⌘⇧8',
  },
  {
    value: 'ordered-list',
    icon: <ListNumbersIcon className="size-4" />,
    label: 'Ordered List',
    shortcut: '⌘⇧9',
  },
  {
    value: 'task-list',
    icon: <ListChecksIcon className="size-4" />,
    label: 'Task List',
    shortcut: '⌘⇧0',
  },
]

export default function ListControls({ editor }: { editor: Editor }) {
  const getCurrentListStyle = (): ListStyle | undefined => {
    if (editor.isActive('bulletList')) return 'bullet-list'
    if (editor.isActive('orderedList')) return 'ordered-list'
    if (editor.isActive('taskList')) return 'task-list'
    return undefined
  }

  const onListStyleChange = (value: ListStyle) => {
    if (value === 'bullet-list') {
      if (editor.isActive('orderedList')) {
        editor.chain().focus().toggleOrderedList().run()
      }
      editor.chain().focus().toggleBulletList().run()
    }
    if (value === 'ordered-list') {
      if (editor.isActive('bulletList')) {
        editor.chain().focus().toggleBulletList().run()
      }
      editor.chain().focus().toggleOrderedList().run()
    }
    if (value === 'task-list') {
      if (editor.isActive('bulletList')) {
        editor.chain().focus().toggleBulletList().run()
      }
      editor.chain().focus().toggleTaskList().run()
    }
  }

  const currentStyle = getCurrentListStyle()

  return (
    <Select
      value={currentStyle || 'bullet-list'}
      onValueChange={onListStyleChange}
    >
      <SelectTrigger bottomIcon className="w-fit shadow-none border-none">
        <SelectValue>
          <ListBulletsIcon
            className={`size-4 ${!currentStyle ? 'text-muted-foreground' : ''}`}
          />
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {listOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                {/* <span>{option.label}</span> */}
                <span className="text-xs text-muted-foreground ml-auto">
                  {option.shortcut}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
