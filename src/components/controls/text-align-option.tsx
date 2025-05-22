import {
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  TextAlignJustifyIcon,
} from '@phosphor-icons/react'
import type { Editor } from '@tiptap/core'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ReactNode } from 'react'

type TextAlignment = 'left' | 'center' | 'right' | 'justify'

const alignmentOptions: {
  value: TextAlignment
  icon: ReactNode
  label: string
  shortcut: string
}[] = [
  {
    value: 'left',
    icon: <TextAlignLeftIcon className="size-4" />,
    label: 'Left',
    shortcut: '⌘⇧L',
  },
  {
    value: 'center',
    icon: <TextAlignCenterIcon className="size-4" />,
    label: 'Center',
    shortcut: '⌘⇧E',
  },
  {
    value: 'right',
    icon: <TextAlignRightIcon className="size-4" />,
    label: 'Right',
    shortcut: '⌘⇧R',
  },
  {
    value: 'justify',
    icon: <TextAlignJustifyIcon className="size-4" />,
    label: 'Justify',
    shortcut: '⌘⇧J',
  },
]

export default function TextAlignOption({ editor }: { editor: Editor }) {
  const currentAlignment = editor.isActive({ textAlign: 'left' })
    ? 'left'
    : editor.isActive({ textAlign: 'center' })
      ? 'center'
      : editor.isActive({ textAlign: 'right' })
        ? 'right'
        : editor.isActive({ textAlign: 'justify' })
          ? 'justify'
          : 'left'

  return (
    <Select
      value={currentAlignment}
      onValueChange={(value: TextAlignment) => {
        editor.chain().focus().setTextAlign(value).run()
      }}
    >
      <SelectTrigger bottomIcon className="w-fit shadow-none border-none">
        <SelectValue>
          {
            alignmentOptions.find((option) => option.value === currentAlignment)
              ?.icon
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {alignmentOptions.map((option) => (
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
      </SelectContent>
    </Select>
  )
}
