import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const SelectionDecoration = Extension.create({
  name: 'selectionDecoration',

  addOptions() {
    return {
      className: 'selection-highlight',
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('selection'),
        props: {
          decorations: (state) => {
            const { selection } = state
            // const { focused } = this.editor

            // Skip decoration if editor is focused or no selection
            if (selection.empty) {
              return null
            }

            // Add decoration to maintain visual selection when editor loses focus
            return DecorationSet.create(state.doc, [
              Decoration.inline(selection.from, selection.to, {
                class: this.options.className,
              }),
            ])
          },
        },
      }),
    ]
  },
})
