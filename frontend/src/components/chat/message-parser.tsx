import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Citation from '@/components/chat/citation'

interface ParsedPart {
  type: 'text' | 'citation'
  content: string
  index: number
  citationNumber?: number
}

export function parseMessageContent(content: string) {
  let currentCitationNumber = 0
  const parts = content
    .split(/(<citation>.*?<\/citation>)/)
    .map((part, index): ParsedPart => {
      if (part.startsWith('<citation>')) {
        currentCitationNumber++
        return {
          type: 'citation',
          content: part.replace(/<\/?citation>/g, ''),
          index,
          citationNumber: currentCitationNumber,
        }
      }
      return {
        type: 'text',
        content: part,
        index,
      }
    })

  return parts.map((part) => {
    if (part.type === 'citation') {
      return (
        <Citation
          key={`citation-${part.index}`}
          citation={part.content}
          count={part.citationNumber!}
        />
      )
    }

    return (
      <span key={`text-${part.index}`} className="inline">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <span>{children}</span>,
          }}
        >
          {part.content}
        </ReactMarkdown>
      </span>
    )
  })
}
