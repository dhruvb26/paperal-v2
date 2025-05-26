import { Extension, Command } from '@tiptap/core'

interface AutoCompleteAPIResponse {
  success: boolean
  error: string | null
  data: {
    response: {
      text: string
      is_referenced: boolean
      href: string | null
      citations?: {
        'in-text': string
      }
      context?: string
    }
  }
}

interface AutoCompleteParams {
  text?: string
  instructions?: string
  onUpdate?: (completion: any) => void
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      sendForSuggestion: (params: AutoCompleteParams) => ReturnType
      acceptSuggestion: () => ReturnType
      rejectSuggestion: () => ReturnType
    }
  }
}

export const AutoComplete = Extension.create({
  name: 'autoComplete',
  priority: 101,

  addOptions() {
    return {
      endpoint: `${process.env.NEXT_PUBLIC_API_URL}/generate`,
      acceptKey: 'ArrowRight',
      suggestionDebounce: 1000,
      previousTextLength: 4000,
    }
  },

  addCommands() {
    return {
      sendForSuggestion: (params: AutoCompleteParams): Command => {
        return ({ editor }) => {
          const content = editor.getText()
          const { from, to } = editor.state.selection
          const selectedText = editor.state.doc.textBetween(from, to)

          fetch(this.options.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: selectedText || content,
              ...params,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error('Failed to fetch completion')
              }
              return response.json()
            })
            .then((data: AutoCompleteAPIResponse) => {
              if (!data.success || data.error) {
                throw new Error(data.error || 'Failed to get completion')
              }

              const chain = editor.chain().focus()

              const responseText = data.data.response.text
              let mainText = responseText
              let trailing = ''
              if (responseText.endsWith('.')) {
                mainText = responseText.slice(0, -1)
                trailing = '.'
              }

              const contentArray: any[] = [{ type: 'text', text: mainText }]
              if (data.data.response.is_referenced && data.data.response.href) {
                const citationText = data.data.response.citations?.['in-text']
                if (citationText) {
                  contentArray.push({ type: 'text', text: ' ' })
                  contentArray.push({
                    type: 'text',
                    text: citationText,
                    marks: [
                      {
                        type: 'customLink',
                        attrs: {
                          href: data.data.response.href,
                          data: 'this is some example data.',
                        },
                      },
                    ],
                  })
                } else {
                  console.error('No citation text found in response')
                }
              }
              if (trailing) {
                contentArray.push({ type: 'text', text: trailing })
              }

              chain.insertContent(contentArray).run()

              if (params.onUpdate) {
                params.onUpdate(data.data.response)
              }
            })
            .catch((error) => {
              console.error('Error in autocomplete:', error)
            })

          return true
        }
      },

      acceptSuggestion: (): Command => {
        return ({ editor }) => {
          editor.chain().focus().unsetMark('textStyle').run()
          return true
        }
      },

      rejectSuggestion: (): Command => {
        return ({ editor }) => {
          const { from, to } = editor.state.selection
          editor.chain().focus().deleteRange({ from, to }).run()
          return true
        }
      },
    }
  },
})
