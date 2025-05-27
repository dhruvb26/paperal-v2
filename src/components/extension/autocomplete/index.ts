import { Extension, Command } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { DecorationSet } from '@tiptap/pm/view'
import {
  AutoCompleteParams,
  AutoCompleteAPIResponse,
} from '@/components/extension/autocomplete/types'
import {
  debounce,
  getTextFromDocument,
} from '@/components/extension/autocomplete/utils'
import {
  createAndDispatchSuggestion,
  handleSuggestionAcceptance,
} from '@/components/extension/autocomplete/handlers'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    autocomplete: {
      sendForSuggestion: (params: AutoCompleteParams) => ReturnType
    }
  }
}

function isAISuggestionsEnabled(): boolean {
  if (typeof document === 'undefined') return true
  const match = document.cookie.match(/(?:^|; )ai_suggestions=([^;]*)/)
  return match ? match[1] === 'true' : true
}

export const AutoComplete = Extension.create({
  name: 'autoComplete',
  priority: 101,

  addOptions() {
    return {
      endpoint: `${process.env.NEXT_PUBLIC_API_URL}/generate`,
      applySuggestionKey: 'ArrowRight',
      suggestionDebounce: 1000,
      previousTextLength: 4000,
    }
  },

  addStorage() {
    return {
      lastInsertPosition: null as { from: number; to: number } | null,
    }
  },

  addProseMirrorPlugins() {
    const pluginKey = new PluginKey<DecorationSet>('suggestion')
    const options = this.options

    const getSuggestion = debounce(
      async (
        previousText: string,
        cb: (
          suggestion: string | null,
          data?: AutoCompleteAPIResponse['data']['response']
        ) => void
      ) => {
        try {
          const response = await fetch(options.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: previousText }),
          })

          if (!response.ok) throw new Error('Failed to fetch completion')

          const jsonResponse =
            (await response.json()) as AutoCompleteAPIResponse
          if (!jsonResponse.success || jsonResponse.error) {
            throw new Error(jsonResponse.error || 'Failed to get completion')
          }

          cb(jsonResponse.data.response.text, jsonResponse.data.response)
        } catch (error) {
          console.error('Error in getSuggestion:', error)
          cb(null)
        }
      },
      options.suggestionDebounce
    )

    return [
      new Plugin({
        key: pluginKey,
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldValue) {
            if (tr.getMeta(pluginKey)) {
              const { decorations } = tr.getMeta(pluginKey)
              return decorations
            }
            return tr.docChanged ? oldValue.map(tr.mapping, tr.doc) : oldValue
          },
        },
        view(editorView) {
          setTimeout(() => {
            const previousText = getTextFromDocument(editorView.state.doc)
            if (!isAISuggestionsEnabled()) return
            getSuggestion(previousText, (suggestion, data) => {
              if (!suggestion || !data) return
              createAndDispatchSuggestion(
                { view: editorView, pluginKey, getSuggestion },
                suggestion,
                data
              )
            })
          }, 0)

          return {
            update(view, prevState) {
              const lastChar = view.state.doc.textContent.slice(-1)
              if (lastChar === '@' || lastChar === '/') return

              if (
                pluginKey.getState(view.state)?.find().length &&
                prevState &&
                !prevState.selection.eq(view.state.selection)
              ) {
                const tr = view.state.tr
                tr.setMeta('addToHistory', false)
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty })
                view.dispatch(tr)
                return
              }

              if (prevState && prevState.doc.eq(view.state.doc)) return

              setTimeout(() => {
                const tr = view.state.tr
                tr.setMeta('addToHistory', true)
                tr.setMeta(pluginKey, { decorations: DecorationSet.empty })
                view.dispatch(tr)

                const previousText = getTextFromDocument(view.state.doc)
                if (!isAISuggestionsEnabled()) return
                getSuggestion(previousText, (suggestion, data) => {
                  if (!suggestion || !data) return
                  createAndDispatchSuggestion(
                    { view, pluginKey, getSuggestion },
                    suggestion,
                    data
                  )
                })
              }, 0)
            },
          }
        },
        props: {
          decorations(editorState) {
            return pluginKey.getState(editorState)
          },
          handleKeyDown(view, event) {
            if (event.key === options.applySuggestionKey && !event.shiftKey) {
              const decorationSet = pluginKey.getState(view.state)
              if (decorationSet?.find().length) {
                const suggestionEl = document.querySelector(
                  '.autocomplete-suggestion'
                ) as HTMLElement
                if (suggestionEl) {
                  handleSuggestionAcceptance(view, suggestionEl, pluginKey)
                  event.preventDefault()
                  return true
                }
              }
            }

            if (event.key === options.applySuggestionKey && event.shiftKey) {
              if (!isAISuggestionsEnabled()) return false
              const previousText = getTextFromDocument(
                view.state.doc,
                options.previousTextLength
              )

              const clearTr = view.state.tr
              clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty })
              view.dispatch(clearTr)

              getSuggestion(previousText, (suggestion, data) => {
                if (!suggestion || !data) return
                createAndDispatchSuggestion(
                  { view, pluginKey, getSuggestion },
                  suggestion,
                  data
                )
              })

              event.preventDefault()
              return true
            }

            return false
          },
        },
      }),
    ]
  },

  addCommands() {
    return {
      sendForSuggestion: (params: AutoCompleteParams): Command => {
        return ({ editor }) => {
          if (!isAISuggestionsEnabled()) return false
          const content = editor.getText()
          const { from, to } = editor.state.selection
          const selectedText = editor.state.doc.textBetween(from, to)

          fetch(this.options.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: selectedText || content,
              ...params,
            }),
          })
            .then((response) => {
              if (!response.ok) throw new Error('Failed to fetch completion')
              return response.json()
            })
            .then((data: AutoCompleteAPIResponse) => {
              if (!data.success || data.error) {
                throw new Error(data.error || 'Failed to get completion')
              }

              const chain = editor.chain().focus()
              const { to } = editor.state.selection

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

              chain.insertContentAt(to, contentArray).run()

              let insertedLength = mainText.length
              if (
                data.data.response.is_referenced &&
                data.data.response.href &&
                data.data.response.citations?.['in-text']
              ) {
                insertedLength +=
                  ' '.length + data.data.response.citations['in-text'].length
              }
              if (trailing) {
                insertedLength += trailing.length
              }

              const insertedText = editor.state.doc.textBetween(
                to,
                to + insertedLength
              )

              this.storage.lastInsertPosition = {
                from: to,
                to: to + insertedText.length,
              }

              editor
                .chain()
                .focus()
                .setTextSelection({
                  from: to,
                  to: to + insertedText.length,
                })
                .run()

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
    }
  },
})
