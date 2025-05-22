import { Extension } from '@tiptap/core'

export const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',

  addKeyboardShortcuts() {
    return {
      // Heading shortcuts
      'Mod-Alt-1': () =>
        this.editor.chain().focus().toggleHeading({ level: 1 }).run(),
      'Mod-Alt-2': () =>
        this.editor.chain().focus().toggleHeading({ level: 2 }).run(),
      'Mod-Alt-3': () =>
        this.editor.chain().focus().toggleHeading({ level: 3 }).run(),

      // List shortcuts
      'Mod-Shift-8': () => this.editor.chain().focus().toggleBulletList().run(),
      'Mod-Shift-9': () =>
        this.editor.chain().focus().toggleOrderedList().run(),

      // Text alignment shortcuts
      'Mod-Shift-l': () =>
        this.editor.chain().focus().setTextAlign('left').run(),
      'Mod-Shift-e': () =>
        this.editor.chain().focus().setTextAlign('center').run(),
      'Mod-Shift-r': () =>
        this.editor.chain().focus().setTextAlign('right').run(),
      'Mod-Shift-j': () =>
        this.editor.chain().focus().setTextAlign('justify').run(),

      // Script shortcuts
      'Mod-,': () => this.editor.chain().focus().toggleSubscript().run(),
      'Mod-.': () => this.editor.chain().focus().toggleSuperscript().run(),

      // Color shortcuts (using function keys)
      F1: () => this.editor.chain().focus().unsetHighlight().run(),
      F2: () =>
        this.editor.chain().focus().setHighlight({ color: '#FFF9C4' }).run(), // Yellow
      F3: () =>
        this.editor.chain().focus().setHighlight({ color: '#C8E6C9' }).run(), // Green
      F4: () =>
        this.editor.chain().focus().setHighlight({ color: '#BBDEFB' }).run(), // Blue
      F5: () =>
        this.editor.chain().focus().setHighlight({ color: '#F8BBD0' }).run(), // Pink
      F6: () =>
        this.editor.chain().focus().setHighlight({ color: '#FFE0B2' }).run(), // Orange
      F7: () =>
        this.editor.chain().focus().setHighlight({ color: '#E1BEE7' }).run(), // Purple
    }
  },
})
