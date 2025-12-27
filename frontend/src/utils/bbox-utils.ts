import { Chunk } from '@/types/chunk'

interface BBox {
  left: number
  top: number
  width: number
  height: number
}

interface Segment {
  bbox: BBox
  segment_type: string
  content: string
  [key: string]: any
}

interface LocalChunk {
  chunk_id: string
  segments: Segment[]
  [key: string]: any
}

export function calculateChunkBBox(chunk: LocalChunk): BBox {
  if (!chunk.segments || chunk.segments.length === 0) {
    throw new Error('Chunk has no segments')
  }

  const firstBBox = chunk.segments[0].bbox
  const anchorLeft = firstBBox.left
  const anchorTop = firstBBox.top

  let maxWidth = firstBBox.width
  let maxHeight = firstBBox.height

  for (let i = 1; i < chunk.segments.length; i++) {
    const bbox = chunk.segments[i].bbox
    const relativeRight = bbox.left + bbox.width - anchorLeft
    const relativeBottom = bbox.top + bbox.height - anchorTop

    maxWidth = Math.max(maxWidth, relativeRight)
    maxHeight = Math.max(maxHeight, relativeBottom)
  }

  return {
    left: anchorLeft,
    top: anchorTop,
    width: maxWidth,
    height: maxHeight,
  }
}

export function processChunksWithBBox(
  chunks: LocalChunk[],
  namespace: string
): Chunk[] {
  return chunks.map((chunk) => ({
    id: chunk.chunk_id,
    namespace: namespace,
    text: chunk.embed,
    bbox: calculateChunkBBox(chunk),
    createdAt: chunk.created_at,
  }))
}
