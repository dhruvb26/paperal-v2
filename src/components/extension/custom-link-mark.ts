import { Mark, mergeAttributes } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

export type CustomLinkData = {
  color: string
  size: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customLink: {
      /**
       * Set a custom link mark
       */
      setCustomLink: (attributes?: {
        href: string
        data?: CustomLinkData
      }) => ReturnType
      /**
       * Unset a custom link mark
       */
      unsetCustomLink: () => ReturnType
    }
  }
}

export interface CustomLinkOptions {
  HTMLAttributes: Record<string, any>
  onClick?: (props: { href: string; data: CustomLinkData }) => void
}

export const CustomLinkMark = Mark.create<CustomLinkOptions>({
  name: 'customLink',

  priority: 1000,

  keepOnSplit: false,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'custom-link',
      },
      onClick: undefined,
    }
  },

  addAttributes() {
    return {
      href: {
        default: null,
      },
      data: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'a[data-type="custom-link"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(
        { 'data-type': 'custom-link' },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      0,
    ]
  },

  addCommands() {
    return {
      setCustomLink:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes)
        },
      unsetCustomLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },

  addProseMirrorPlugins() {
    const onClick = this.options.onClick

    return [
      new Plugin({
        key: new PluginKey('custom-link-click'),
        props: {
          handleClick(view: EditorView, pos: number, event: MouseEvent) {
            if (!onClick) return false

            const { state } = view
            const { doc } = state
            const $pos = doc.resolve(pos)
            const marks = $pos.marks()

            for (const mark of marks) {
              if (mark.type.name === 'customLink') {
                event.preventDefault()
                onClick({
                  href: mark.attrs.href,
                  data: mark.attrs.data,
                })
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})
