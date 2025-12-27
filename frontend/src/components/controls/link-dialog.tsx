import { Editor } from '@tiptap/core'
import { Button } from '@/components/ui/button'
import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { LinkSimpleHorizontalIcon } from '@phosphor-icons/react'
import { Check, Trash2 } from 'lucide-react'
import TooltipWrapper from '@/components/ui/tooltip-wrapper'

export default function LinkDialog({ editor }: { editor: Editor }) {
  const [isOpen, setIsOpen] = useState(false)
  const [url, setUrl] = useState('')
  const popoverRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setIsOpen(false)
  }

  const handleSetLink = () => {
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setIsOpen(false)
      return
    }

    try {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: url,
          target: '_blank',
        })
        .run()
      setIsOpen(false)
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert(e.message)
      }
    }
  }

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl)
    if (editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({
          href: newUrl,
          target: '_blank',
        })
        .run()
    }
  }

  const openPopover = () => {
    const previousUrl = editor.getAttributes('link').href
    setUrl(previousUrl || '')
    setIsOpen(!isOpen)
  }

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    if (inputRef.current) {
      inputRef.current.focus()
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative">
      <TooltipWrapper tooltip="Link">
        <Button
          ref={buttonRef}
          variant={'ghost'}
          size={'icon'}
          onClick={openPopover}
          className={editor.isActive('link') ? 'bg-accent' : ''}
        >
          <LinkSimpleHorizontalIcon />
        </Button>
      </TooltipWrapper>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute -left-24 top-full z-50 rounded-md p-2 w-[350px] mt-2"
        >
          <div className="relative">
            <Input
              ref={inputRef}
              type="url"
              placeholder="Enter URL"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (!editor.isActive('link')) {
                    handleSetLink()
                  } else {
                    setIsOpen(false)
                  }
                }
              }}
              className="pr-10"
            />
            <div className="absolute right-0.5 top-1/2 -translate-y-1/2">
              {!editor.isActive('link') ? (
                <Button
                  size={'icon'}
                  variant={'ghost'}
                  className="bg-success/10 hover:bg-success/20"
                  onClick={handleSetLink}
                >
                  <Check className="text-success" size={16} />
                </Button>
              ) : (
                <Button
                  size={'icon'}
                  variant={'ghost'}
                  onClick={handleRemoveLink}
                  className="bg-destructive/10 hover:bg-destructive/20"
                >
                  <Trash2 className="text-destructive" size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
