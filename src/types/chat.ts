import { z } from 'zod'

export type Message = {
  id?: string
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
  timestamp?: Date
}

export type UIMessage = {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  queryResults?: Array<{
    id: string
    text: string
    score: number
  }>
}

export type ToolCall = {
  id: string
  function: {
    name: string
    arguments: string
  }
}

export const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant', 'tool']),
      content: z.string().nullable(),
      tool_calls: z.array(z.any()).optional(),
      tool_call_id: z.string().optional(),
    })
  ),
  url: z.string().optional(),
})
