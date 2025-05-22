'use client'

import { useCallback, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import type { Editor } from '@tiptap/react'

const colorOptions = [
  { label: 'Default', value: 'none' },
  { label: 'Yellow', value: '#FFF9C4' },
  { label: 'Green', value: '#C8E6C9' },
  { label: 'Blue', value: '#BBDEFB' },
  { label: 'Pink', value: '#F8BBD0' },
  { label: 'Orange', value: '#FFE0B2' },
  { label: 'Purple', value: '#E1BEE7' },
]

export function ColorPicker({ editor }: { editor: Editor }) {
  const [selectedValue, setSelectedValue] = useState('none')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleColorChange = useCallback(
    (color: string) => {
      setSelectedValue(color)
      if (color === 'none') {
        editor.chain().focus().unsetHighlight().run()
      } else {
        editor.chain().focus().setHighlight({ color }).run()
      }
    },
    [editor]
  )

  if (!mounted) {
    return null
  }

  return (
    <Select value={selectedValue} onValueChange={handleColorChange}>
      <SelectTrigger className={cn('w-fit shadow-none border-none')}>
        <div
          className={cn('w-4 h-4 rounded-sm border border-border')}
          style={
            selectedValue !== 'none'
              ? { backgroundColor: selectedValue }
              : undefined
          }
        />
      </SelectTrigger>
      <SelectContent>
        {colorOptions.map((color) => (
          <SelectItem key={color.value} value={color.value}>
            <div className="flex items-center gap-2">
              <div
                className={cn('w-4 h-4 rounded-sm border border-border')}
                style={
                  color.value !== 'none'
                    ? { backgroundColor: color.value }
                    : undefined
                }
              />
              {color.label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
