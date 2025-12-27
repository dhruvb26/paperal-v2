import { PluginKey } from '@tiptap/pm/state'

export interface AutoCompleteAPIResponse {
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

export interface AutoCompleteParams {
  text?: string
  instructions?: string
  onUpdate?: (completion: any) => void
}

export type GetSuggestionCallback = (
  suggestion: string | null,
  data?: AutoCompleteAPIResponse['data']['response']
) => void

export type GetSuggestionFunction = (
  previousText: string,
  cb: GetSuggestionCallback
) => void

export interface SuggestionHandlerContext {
  view: any
  pluginKey: PluginKey
  getSuggestion: GetSuggestionFunction
}
