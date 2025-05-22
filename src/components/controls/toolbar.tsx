'use client'

import { Button } from '@/components/ui/button'
import { ColorPicker } from '@/components/ui/color-picker'
import LinkDialog from '@/components/controls/link-dialog'
import TextStyleSelect from '@/components/controls/text-style-select'
import TextScriptOption from '@/components/controls/text-script-option'
import TextAlignOption from '@/components/controls/text-align-option'
import { TextItalicIcon } from '@phosphor-icons/react'
import ExtraOptions from '@/components/controls/extra-options'
import TooltipWrapper from '@/components/ui/tooltip-wrapper'
import { Redo, Undo } from 'lucide-react'
import ListControls from '@/components/controls/list-style-select'
import { useEditorStore } from '@/stores/editor-store'
import { updateDocument } from '@/actions/document'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useCallback, useEffect } from 'react'
import debounce from 'lodash/debounce'

const Toolbar = () => {
  const { editor } = useEditorStore()
  const pathname = usePathname()

  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      const result = await updateDocument(pathname.split('/').pop() as string, {
        content: content,
      })
      if ('error' in result) {
        toast.error(result.error.message)
        return
      }
    }, 500),
    [pathname]
  )

  useEffect(() => {
    if (!editor) return

    const updateListener = () => {
      const content = editor.getHTML()
      debouncedSave(content)
    }

    editor.on('update', updateListener)
    return () => {
      debouncedSave.cancel()
      editor.off('update', updateListener)
    }
  }, [editor, debouncedSave])

  const handleSave = async () => {
    if (!editor) return
    const result = await updateDocument(pathname.split('/').pop() as string, {
      content: editor.getHTML(),
    })
    if ('error' in result) {
      toast.error(result.error.message)
      return
    }
    toast.success('Document saved successfully')
  }

  if (!editor) return null

  return (
    <div className="relative flex flex-col items-center justify-center w-full z-10 bg-background p-1 sm:p-2">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 shadow-none bg-background mt-2 w-full">
        <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
          <TooltipWrapper tooltip="Undo ⌘+Z">
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
            >
              <Undo />
            </Button>
          </TooltipWrapper>

          <TooltipWrapper tooltip="Redo ⌘+Y">
            <Button
              variant={'ghost'}
              size={'icon'}
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
            >
              <Redo />
            </Button>
          </TooltipWrapper>

          <div className="border-l border-border h-6 hidden sm:block" />
          <ColorPicker editor={editor} />
          <div className="border-l border-border h-6 hidden sm:block" />

          <TooltipWrapper tooltip="Bold ⌘+B">
            <Button
              variant={'ghost'}
              size={'icon'}
              className={`text-base ${editor.isActive('bold') ? 'bg-accent font-medium' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              B
            </Button>
          </TooltipWrapper>

          <TooltipWrapper tooltip="Italic ⌘+I">
            <Button
              variant={'ghost'}
              size={'icon'}
              className={`text-base ${editor.isActive('italic') ? 'bg-accent font-medium' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <TextItalicIcon weight="bold" size={16} />
            </Button>
          </TooltipWrapper>

          <TooltipWrapper tooltip="Strikethrough ⌘+S">
            <Button
              variant={'ghost'}
              size={'icon'}
              className={`text-base font-mono line-through ${editor.isActive('strike') ? 'bg-accent font-medium' : ''}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              S
            </Button>
          </TooltipWrapper>

          <TooltipWrapper tooltip="Underline ⌘+U">
            <Button
              variant={'ghost'}
              size={'icon'}
              className={`text-base underline ${editor.isActive('underline') ? 'bg-accent font-medium' : ''}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              U
            </Button>
          </TooltipWrapper>

          <LinkDialog editor={editor} />
          <div className="border-l border-border h-6 hidden sm:block" />
          <TextStyleSelect editor={editor} />
          <ListControls editor={editor} />
          <TextAlignOption editor={editor} />
          <TextScriptOption editor={editor} />
          <div className="border-l border-border h-6 hidden sm:block" />
          <ExtraOptions editor={editor} />
          <div className="border-l border-border h-6 hidden sm:block" />
          <Button variant={'ghost'} size={'sm'} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Toolbar
