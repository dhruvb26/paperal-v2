import { create } from 'zustand'

interface CitationStore {
  hoveredChunkId: string | null
  hoveredChunkPage: number | null
  setHoveredChunkId: (id: string | null, page: number | null) => void
}

export const useCitationStore = create<CitationStore>((set) => ({
  hoveredChunkId: null,
  hoveredChunkPage: null,
  setHoveredChunkId: (id, page) =>
    set({ hoveredChunkId: id, hoveredChunkPage: page }),
}))
