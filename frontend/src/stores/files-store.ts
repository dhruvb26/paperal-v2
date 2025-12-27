import { create } from 'zustand'
import type { File } from '@/types/file'

interface FileStore {
  files: File[]
  refreshCounter: number
  setFiles: (files: File[]) => void
  addFile: (file: File) => void
  removeFile: (id: string) => void
  triggerRefresh: () => void
}

export const useFileStore = create<FileStore>((set) => ({
  files: [],
  refreshCounter: 0,
  setFiles: (files) => set({ files }),
  addFile: (file) =>
    set((state) => ({
      files: [file, ...state.files],
    })),
  removeFile: (id) =>
    set((state) => ({
      files: state.files.filter((file) => file.id !== id),
    })),
  triggerRefresh: () =>
    set((state) => ({ refreshCounter: state.refreshCounter + 1 })),
}))
