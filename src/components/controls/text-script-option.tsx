import { TextSubscriptIcon, TextSuperscriptIcon } from '@phosphor-icons/react'
import type { Editor } from '@tiptap/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReactNode } from 'react'

type TextScript = 'normal' | 'super' | 'sub'

const scriptOptions: {
  value: TextScript
  icon: ReactNode
  label: string
  shortcut?: string
}[] = [
  {
    value: 'normal',
    icon: null,
    label: 'Normal',
  },
  {
    value: 'super',
    icon: <TextSuperscriptIcon className="size-4" />,
    label: 'Superscript',
    shortcut: '⌘.',
  },
  {
    value: 'sub',
    icon: <TextSubscriptIcon className="size-4" />,
    label: 'Subscript',
    shortcut: '⌘,',
  },
]

export default function TextScriptOption({ editor }: { editor: Editor }) {
  const currentScript = editor.isActive('superscript')
    ? 'super'
    : editor.isActive('subscript')
      ? 'sub'
      : 'normal'

  return (
    <Select
      value={currentScript}
      onValueChange={(value: TextScript) => {
        if (value === 'super') {
          editor.chain().focus().toggleSuperscript().run()
        } else if (value === 'sub') {
          editor.chain().focus().toggleSubscript().run()
        } else {
          // If currently superscript or subscript, toggle it off
          if (editor.isActive('superscript')) {
            editor.chain().focus().toggleSuperscript().run()
          }
          if (editor.isActive('subscript')) {
            editor.chain().focus().toggleSubscript().run()
          }
        }
      }}
    >
      <SelectTrigger className="w-fit shadow-none border-none" bottomIcon>
        <SelectValue>
          {scriptOptions.find((option) => option.value === currentScript)
            ?.icon || 'Aa'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {scriptOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex items-center gap-2">
              {option.icon}
              <span>{option.label}</span>
              {option.shortcut && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {option.shortcut}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
