'use client'

import { useState, type Dispatch, type SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSelectedTextStore } from '@/stores/selected-text-store'
import AssistantMessage from '@/components/chat/assistant-message'
import UserMessage from '@/components/chat/user-message'
import AssistantLoader from '@/components/chat/assistant-loader'
import { UIMessage } from '@/types/chat'

async function parseResponse(
  response: Response,
  setStreamingText: Dispatch<SetStateAction<string>>
): Promise<string> {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('Failed to get reader')

  const decoder = new TextDecoder()
  let result = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value, { stream: true })
    result += chunk
    setStreamingText((prev: string) => prev + chunk)
  }

  return result
}

export default function PDFChat({ url }: { url: string }) {
  const [messages, setMessages] = useState<UIMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { selectedText, clearSelectedText } = useSelectedTextStore()
  const [streamingText, setStreamingText] = useState('')

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !selectedText) || isLoading) return

    const messageContent = selectedText
      ? `"${selectedText}"\n\n${inputMessage}`
      : inputMessage

    const userMessage: UIMessage = {
      id: Date.now().toString(),
      content: messageContent,
      role: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)
    clearSelectedText()

    try {
      setStreamingText('')
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          url,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const fullResponse = await parseResponse(response, setStreamingText)

      const assistantMessage: UIMessage = {
        id: Date.now().toString(),
        content: fullResponse,
        role: 'assistant',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
      console.error('Chat error:', error)
    } finally {
      setIsLoading(false)
      setInputMessage('')
      setStreamingText('')
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.role === 'assistant' && (
              <AssistantMessage message={message} />
            )}
            {message.role === 'user' && <UserMessage message={message} />}
          </div>
        ))}
        {isLoading && !streamingText && (
          <div className="flex justify-start">
            <AssistantLoader />
          </div>
        )}
        {streamingText && (
          <div className="flex justify-start">
            <AssistantMessage
              message={{
                id: 'streaming',
                content: streamingText,
                role: 'assistant',
                timestamp: new Date(),
              }}
              isStreaming
            />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2">
        {selectedText && (
          <div className="flex items-center gap-2 p-2 pr-3 bg-muted rounded-lg max-w-full">
            <div className="flex-1 text-sm text-muted-foreground line-clamp-1">
              {selectedText}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-background/50"
              onClick={clearSelectedText}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="relative">
          <Textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Let your questions begin."
            className="resize-none pr-12 rounded-xl border-none bg-muted text-muted-foreground text-sm max-h-12 font-medium"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            size="icon"
            className="absolute bottom-2 right-2 rounded-lg"
            disabled={isLoading}
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  )
}
