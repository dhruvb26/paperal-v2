'use client'

import { useEditor, EditorContent, Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Color from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import Placeholder from '@tiptap/extension-placeholder'
import Toolbar from '@/components/controls/toolbar'
import AITools from '@/components/controls/ai-tools'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { CustomLinkMark } from '@/components/extension/custom-link-mark'
import { SelectionDecoration } from '@/components/extension/selection-decoration'
import { AI } from '@/components/extension/autocomplete'
import { KeyboardShortcuts } from '@/components/extension/keyboard-shortcuts'
import { useEditorStore } from '@/stores/editor-store'
import {
  textAlignConfig,
  linkConfig,
  highlightConfig,
  placeholderConfig,
  customLinkConfig,
} from '@/lib/editor-configs'

const Tiptap = ({ content }: { content: string }) => {
  const { setEditor } = useEditorStore()

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: false,
    onBeforeCreate({ editor }) {
      setTimeout(() => {
        editor.commands.focus('end')
      }, 0)
    },
    onCreate({ editor }) {
      setEditor(editor as Editor)
    },
    extensions: [
      StarterKit,
      Underline,
      Color,
      Image,
      TextStyle,
      Subscript,
      Superscript,
      TaskList,
      TaskItem,
      AI,
      KeyboardShortcuts,
      Highlight.configure(highlightConfig),
      Link.configure(linkConfig),
      CustomLinkMark.configure(customLinkConfig),
      TextAlign.configure(textAlignConfig),
      Placeholder.configure(placeholderConfig),
      SelectionDecoration,
    ],
    content: content,
  })

  if (!editor) return null

  return (
    <div className="flex flex-col h-full relative">
      <Toolbar />
      <div className="flex-1 overflow-auto w-full">
        <div className="max-w-6xl mx-auto">
          <EditorContent
            className="py-8 px-4 md:px-12 lg:px-24 xl:px-32 w-full"
            style={{
              userSelect: 'none',
            }}
            editor={editor}
          />
        </div>
      </div>
      <AITools />
    </div>
  )
}

export default Tiptap
