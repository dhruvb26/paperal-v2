import { Extension } from '@tiptap/core'

export type AICompletion = {
  text: string
  onAccept: () => void
  onReject: () => void
  onInsertBelow: () => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ai: {
      send: (params: {
        text: string
        instructions: string
        onUpdate?: (completion: AICompletion) => void
      }) => ReturnType
    }
  }
}

export const AI = Extension.create({
  name: 'ai',
  addOptions() {
    return {
      defaultModel: 'gpt-4o-mini',
    }
  },

  addCommands() {
    return {
      send:
        (params) =>
        ({ editor }) => {
          const { text, instructions, onUpdate } =
            typeof params === 'string' ? JSON.parse(params) : params

          if (!instructions) {
            console.error('Missing instructions')
            return false
          }

          const systemPrompt = 'You are a helpful assistant.'
          const userPrompt = `Here is the text written by the user: ${text} \n\n ${instructions}`

          const startPos = editor.state.selection.from
          const endPos = editor.state.selection.to
          let completion = ''
          let insertedContentLength = 0
          let hasReplacedText = false
          const originalText = text

          const updateCompletion = (
            completion: string | null,
            handlers?: {
              onAccept: () => void
              onReject: () => void
              onInsertBelow: () => void
            }
          ) => {
            if (onUpdate) {
              onUpdate(
                completion
                  ? {
                      text: completion,
                      ...handlers,
                    }
                  : null
              )
            }
          }

          const handleAccept = () => {
            editor
              .chain()
              .focus()
              .setTextSelection({
                from: startPos,
                to: startPos + insertedContentLength,
              })
              .unsetMark('textStyle')
              .run()

            updateCompletion(null)
          }

          const handleReject = () => {
            editor
              .chain()
              .focus()
              .deleteRange({
                from: startPos,
                to: startPos + insertedContentLength,
              })
              .insertContent({
                type: 'text',
                text: originalText,
              })
              .run()

            updateCompletion(null)
          }

          const handleInsertBelow = () => {
            // Restore original text
            editor
              .chain()
              .focus()
              .deleteRange({
                from: startPos,
                to: startPos + insertedContentLength,
              })
              .insertContent({
                type: 'text',
                text: originalText,
              })
              .run()

            // Insert completion below
            editor
              .chain()
              .focus()
              .setTextSelection(startPos + originalText.length)
              .insertContent({
                type: 'text',
                text: '\n\n' + completion,
              })
              .run()

            updateCompletion(null)
          }

          fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
              model: this.options.defaultModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              stream: true,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`)
              }

              if (!response.body) {
                throw new Error('Response body is null')
              }

              const reader = response.body.getReader()
              const decoder = new TextDecoder()
              let buffer = ''

              const processText = async (): Promise<void> => {
                try {
                  const { done, value } = await reader.read()

                  if (done) {
                    return
                  }

                  buffer += decoder.decode(value)
                  const lines = buffer.split('\n')
                  buffer = lines.pop() || ''

                  for (const line of lines) {
                    if (line.startsWith('data: ')) {
                      const data = line.slice(6)

                      if (data === '[DONE]') {
                        return
                      }

                      try {
                        const json = JSON.parse(data)
                        const content = json.choices?.[0]?.delta?.content

                        if (content) {
                          completion += content

                          // If this is the first content chunk, replace selected text first
                          if (!hasReplacedText) {
                            editor
                              .chain()
                              .focus()
                              .deleteRange({
                                from: startPos,
                                to: endPos,
                              })
                              .insertContent({
                                type: 'text',
                                text: content,
                              })
                              .run()

                            hasReplacedText = true
                            insertedContentLength = content.length
                          } else {
                            // For subsequent chunks, just append to the end
                            editor
                              .chain()
                              .focus()
                              .setTextSelection(
                                startPos + insertedContentLength
                              )
                              .insertContent({
                                type: 'text',
                                text: content,
                              })
                              .run()

                            insertedContentLength += content.length
                          }

                          // Select the entire inserted text after each chunk
                          editor
                            .chain()
                            .focus()
                            .setTextSelection({
                              from: startPos,
                              to: startPos + insertedContentLength,
                            })
                            .run()

                          // Update the suggestion using the callback
                          updateCompletion(completion, {
                            onAccept: handleAccept,
                            onReject: handleReject,
                            onInsertBelow: handleInsertBelow,
                          })
                        }
                      } catch (e) {
                        console.error('Error parsing JSON:', e)
                      }
                    }
                  }

                  return processText()
                } catch (error) {
                  console.error('Error processing stream:', error)
                  handleReject()
                }
              }

              return processText()
            })
            .catch((error) => {
              console.error('Error in streaming API call:', error)
              handleReject()
            })

          return true
        },
    }
  },
})
