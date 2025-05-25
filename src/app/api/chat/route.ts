import { tools, TOOL_MAPPING, ToolNames } from '@/utils/tools'
import { Message, requestSchema } from '@/types/chat'

async function recursiveOpenRouter(
  messages: Message[],
  url?: string,
  onChunk?: (chunk: string) => void
): Promise<string> {
  const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions'
  const headers = {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const body = {
    model: 'openai/gpt-4o',
    tools,
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant that only helps answering questions about the document at URL: ${url}.\n\n
        When you are asked to answer a question about the document you can use the tools to fetch information from the document.
        For each statement that uses information from the document, you must immediately follow that statement with a citation.
        Citations must be placed directly after each sentence they support, not grouped at the end.\n\n

        If the user asks a question about the document, but you can't find the answer in the document, you must change 
        the query for tool calls to get more information.
        
        Citation format:
        - Include the page number in square brackets
        - Place the citation in HTML tags immediately after the relevant sentence
        - Format: <citation>chunk_id[page_number]</citation>
        
        Example:
        The sky is blue according to the study <citation>chunk123[1]</citation>. Further research showed it changes color at sunset <citation>chunk124[2]</citation>.
        
        Important:
        - Never group citations at the end
        - Each sentence using document information must have its own citation
        - If a sentence uses multiple chunks, include all relevant citations
        - Don't use any markdown formatting
        `,
      },
      ...messages,
    ],
    stream: true,
  }

  const response = await fetch(OPENROUTER_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (response) {
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get reader')
    }

    const decoder = new TextDecoder()
    let dataBuffer = ''
    let toolCallBuffer = ''
    let currentToolCall: any = null
    let finalResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      dataBuffer += decoder.decode(value, { stream: true })

      let nl: number
      while ((nl = dataBuffer.indexOf('\n')) !== -1) {
        const line = dataBuffer.slice(0, nl).trim()
        dataBuffer = dataBuffer.slice(nl + 1)
        if (!line.startsWith('data: ')) continue

        const payload = line.slice(6)
        if (payload === '[DONE]') {
          break
        }
        const data = JSON.parse(payload)

        const delta = data.choices[0].delta

        if (delta.tool_calls) {
          const toolCall = delta.tool_calls[0]

          if (!currentToolCall) {
            currentToolCall = {
              id: toolCall.id,
              function: {
                name: toolCall.function?.name || '',
                arguments: '',
              },
            }
          }

          if (toolCall.function?.arguments) {
            toolCallBuffer += toolCall.function.arguments
            currentToolCall.function.arguments = toolCallBuffer
          }

          if (toolCall.function?.name) {
            currentToolCall.function.name = toolCall.function.name
          }

          if (
            currentToolCall.function.name &&
            currentToolCall.function.arguments
          ) {
            try {
              JSON.parse(currentToolCall.function.arguments)

              messages.push({
                role: 'assistant',
                content: null,
                tool_calls: [
                  {
                    ...currentToolCall,
                    type: 'function',
                  },
                ],
              })

              const toolResponse = await getToolResponse(currentToolCall)
              messages.push(toolResponse)

              currentToolCall = null
              toolCallBuffer = ''

              return await recursiveOpenRouter(messages, url, onChunk)
            } catch {
              // ignore JSON.parse errors until we've received the full arguments payload
            }
          }
        }

        if (delta.content) {
          finalResponse += delta.content
          if (onChunk) onChunk(delta.content)
        }
      }
    }

    return finalResponse
  }

  return ''
}

async function getToolResponse(toolCall: any) {
  const toolName = toolCall.function.name as ToolNames
  const toolArgs = JSON.parse(toolCall.function.arguments)

  if (!TOOL_MAPPING[toolName]) {
    throw new Error(`Unknown tool: ${toolName}`)
  }

  if (toolName === 'QueryDB') {
    console.log('QueryDB called')
    const toolResult = await TOOL_MAPPING[toolName](toolArgs)
    const actualResponse = toolResult.response
    return {
      role: 'tool',
      tool_call_id: toolCall.id,
      content:
        typeof toolResult === 'object'
          ? JSON.stringify(actualResponse)
          : String(actualResponse),
    } as Message
  }

  if (toolName === 'QueryVectorDB') {
    console.log('QueryVectorDB called')
  }

  const toolResult = await TOOL_MAPPING[toolName](toolArgs)

  return {
    role: 'tool',
    tool_call_id: toolCall.id,
    content:
      typeof toolResult === 'object'
        ? JSON.stringify(toolResult)
        : String(toolResult),
  } as Message
}

export async function POST(req: Request) {
  const { messages: reqMessages, url: reqUrl } = await req.json()

  const { messages, url } = requestSchema.parse({
    messages: reqMessages,
    url: reqUrl,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      await recursiveOpenRouter(messages, url, (chunk) => {
        controller.enqueue(encoder.encode(chunk))
      })
      controller.close()
    },
  })

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  })
}
