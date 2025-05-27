import { DecorationSet, Decoration } from '@tiptap/pm/view'
import {
  AutoCompleteAPIResponse,
  SuggestionHandlerContext,
} from '@/components/extension/autocomplete/types'
import {
  createButton,
  getTextFromDocument,
} from '@/components/extension/autocomplete/utils'

export async function handleSuggestionAcceptance(
  view: any,
  suggestionEl: HTMLElement,
  pluginKey: any
) {
  const tr = view.state.tr
  const responseData = JSON.parse(
    suggestionEl.getAttribute('data-response-data') || '{}'
  )
  const schema = view.state.schema

  if (responseData.citations?.['in-text']) {
    const text = responseData.text.replace(/\.$/, '')
    tr.replaceWith(tr.selection.from, tr.selection.from, [
      schema.text(text + ' '),
      schema.text(responseData.citations['in-text'], [
        schema.marks.link.create({ href: responseData.href }),
      ]),
      schema.text('.'),
    ])
  } else {
    tr.insertText((suggestionEl.textContent || '') + ' ')
  }

  view.dispatch(tr)
  view.dispatch(
    view.state.tr.setMeta(pluginKey, { decorations: DecorationSet.empty })
  )

  // Request new suggestion after acceptance
  setTimeout(() => {
    const plugin = view.state.plugins.find((p: any) => p.key === pluginKey)
    if (plugin?.spec.view?.props.getSuggestion) {
      const previousText = getTextFromDocument(view.state.doc)
      plugin.spec
        .view(view)
        .props.getSuggestion(
          previousText,
          (
            suggestion: string | null,
            data?: AutoCompleteAPIResponse['data']['response']
          ) => {
            if (!suggestion || !data) return
            createAndDispatchSuggestion(
              {
                view,
                pluginKey,
                getSuggestion: plugin.spec.view(view).props.getSuggestion,
              },
              suggestion,
              data
            )
          }
        )
    }
  }, 0)

  return true
}

export function createAndDispatchSuggestion(
  context: SuggestionHandlerContext,
  suggestion: string,
  data: AutoCompleteAPIResponse['data']['response']
) {
  const { view, pluginKey, getSuggestion } = context
  const cursorPos = view.state.selection.$head.pos

  const createSuggestionWidget = () => {
    const container = document.createElement('span')
    const suggestionSpan = document.createElement('span')
    const shortcuts = document.createElement('div')

    container.classList.add('autocomplete-suggestion-container')
    suggestionSpan.classList.add('autocomplete-suggestion')
    shortcuts.classList.add('autocomplete-shortcuts')

    // Format suggestion text
    suggestionSpan.innerHTML = data.citations?.['in-text']
      ? `${suggestion.replace(/\.$/, '')} <span class="citation">${data.citations['in-text']}</span>.`
      : suggestion

    suggestionSpan.setAttribute('data-response-data', JSON.stringify(data))

    // Create buttons
    const buttons = [
      {
        text: '→ to accept',
        handler: (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          handleSuggestionAcceptance(view, suggestionSpan, pluginKey)
        },
      },
      {
        text: 'Shift + → for new',
        handler: (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          const previousText = getTextFromDocument(view.state.doc)

          const clearTr = view.state.tr
          clearTr.setMeta(pluginKey, { decorations: DecorationSet.empty })
          view.dispatch(clearTr)

          getSuggestion(previousText, (newSuggestion, newData) => {
            if (!newSuggestion || !newData) return
            createAndDispatchSuggestion(
              { view, pluginKey, getSuggestion },
              newSuggestion,
              newData
            )
          })
        },
      },
    ]

    buttons.forEach(({ text, handler }) => {
      shortcuts.appendChild(createButton(text, handler))
    })

    container.appendChild(suggestionSpan)
    container.appendChild(shortcuts)

    requestAnimationFrame(() => (container.style.opacity = '1'))
    return container
  }

  const suggestionDecoration = Decoration.widget(
    cursorPos,
    createSuggestionWidget,
    {
      side: 1,
      key: 'suggestion-widget',
    }
  )

  const tr = view.state.tr
  tr.setMeta('addToHistory', false)
  tr.setMeta(pluginKey, {
    decorations: DecorationSet.create(view.state.doc, [suggestionDecoration]),
  })
  view.dispatch(tr)
}
