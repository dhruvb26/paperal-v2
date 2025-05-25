'use client'

import { useCitationStore } from '@/stores/citation-store'
import { Chunk } from '@/types/chunk'

export default function BoundingBox({
  chunks,
  pageNumber,
  scale,
}: {
  chunks: Chunk[]
  pageNumber: number
  scale: number
}) {
  const hoveredChunkId = useCitationStore((state) => state.hoveredChunkId)
  const hoveredChunkPage = useCitationStore((state) => state.hoveredChunkPage)

  const shouldShowBoundingBoxes =
    hoveredChunkPage === null || hoveredChunkPage === pageNumber

  const pageChunks = chunks.filter(
    (chunk) => !chunk.page || chunk.page === pageNumber
  )

  return (
    <div className="absolute inset-0 pointer-events-none">
      {shouldShowBoundingBoxes &&
        pageChunks.map((chunk, index) => (
          <div
            key={`${chunk.id}-${index}`}
            className={`absolute border-2 border-blue-500/50 bg-blue-500/10 transition-opacity ${
              hoveredChunkId === chunk.id ? 'opacity-75' : 'opacity-0'
            }`}
            style={{
              top: chunk.bbox.top * scale,
              left: chunk.bbox.left * scale,
              width: chunk.bbox.width * scale,
              height: chunk.bbox.height * scale,
            }}
            title={chunk.text}
          />
        ))}
    </div>
  )
}
