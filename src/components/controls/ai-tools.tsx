'use client'
import type { Editor } from '@tiptap/core'
import { Button } from '@/components/ui/button'
import { useEffect, useState, useRef } from 'react'
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react'
import { UserPen, Pen, Check, X, ArrowUp, ArrowDown } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { AICompletion } from '@/components/extension/autocomplete'
import { useEditorStore } from '@/stores/editor-store'

const AITools = () => {
  const { editor } = useEditorStore()
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [completion, setCompletion] = useState<AICompletion | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const updateSelection = () => {
      const { from, to } = editor.state.selection
      const selectedText = editor.view.state.doc.textBetween(from, to)

      if (selectedText && from !== to) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    editor.on('selectionUpdate', updateSelection)
    return () => {
      editor.off('selectionUpdate', updateSelection)
    }
  }, [editor])

  useEffect(() => {
    if (!isExpanded) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isExpanded])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editor || !customPrompt.trim()) return

    const { from, to } = editor.state.selection
    const selectedText = editor.view.state.doc.textBetween(from, to)

    if (!selectedText) {
      toast.error('Please select some text first.')
      return
    }

    setIsGenerating(true)
    setIsExpanded(true)

    try {
      editor.commands.send({
        text: selectedText,
        instructions: customPrompt,
        onUpdate: (completion: AICompletion) => {
          setCompletion(completion)
        },
      })
    } finally {
      setIsGenerating(false)
      setCustomPrompt('')
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className="absolute flex flex-col z-50 bottom-4 left-4"
      style={{
        minWidth: isExpanded ? '500px' : 'auto',
        maxWidth: isExpanded ? '600px' : 'auto',
      }}
    >
      {!isExpanded ? (
        <Button
          size={'sm'}
          variant="outline"
          onClick={() => setIsExpanded(true)}
        >
          <Pen size={16} />
          Edit
        </Button>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="p-2">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Let your thoughts flow."
                className="min-h-[100px] pr-12  resize-none bg-background"
              />

              {completion || isGenerating ? (
                <div className="space-x-1 absolute bottom-2 right-2 p-0 m-0 hover:cursor-pointer disabled:cursor-not-allowed text-foreground disabled:text-muted-foreground">
                  <Button
                    size="sm"
                    className="bg-success/10 hover:bg-success/20 text-success"
                    onClick={() => {
                      completion?.onAccept()
                      setIsExpanded(false)
                    }}
                    disabled={isGenerating}
                  >
                    <Check className="text-success" size={16} />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive"
                    onClick={() => {
                      completion?.onReject()
                      setIsExpanded(false)
                    }}
                    disabled={isGenerating}
                  >
                    <X className="text-destructive" size={16} />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant={'ghost'}
                    onClick={() => handleSubmit}
                    disabled={isGenerating}
                  >
                    <ArrowCounterClockwiseIcon size={16} />
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    variant={'ghost'}
                    onClick={() => {
                      completion?.onInsertBelow()
                      setIsExpanded(false)
                    }}
                    disabled={isGenerating}
                  >
                    <ArrowDown size={16} />
                    Insert Below
                  </Button>
                </div>
              ) : (
                <div className="flex flex-row items-center justify-between absolute bottom-2 left-2 right-2">
                  <Button variant="outline" size="sm" onClick={() => {}}>
                    <UserPen size={20} />
                    <span>Write like me</span>
                  </Button>

                  <Button
                    type="submit"
                    size={'sm'}
                    disabled={!customPrompt.trim()}
                  >
                    <ArrowUp size={20} />
                    Send
                  </Button>
                </div>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  )
}

export default AITools
