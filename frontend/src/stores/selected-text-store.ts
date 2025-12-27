import { create } from 'zustand'

interface SelectedTextState {
  selectedText: string
  setSelectedText: (text: string) => void
  clearSelectedText: () => void
}

export const useSelectedTextStore = create<SelectedTextState>((set) => ({
  selectedText: '',
  setSelectedText: (text) => set({ selectedText: text }),
  clearSelectedText: () => set({ selectedText: '' }),
}))
