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
  let minLeft = firstBBox.left
  let minTop = firstBBox.top
  let maxRight = firstBBox.left + firstBBox.width
  let maxBottom = firstBBox.top + firstBBox.height

  for (let i = 1; i < chunk.segments.length; i++) {
    const bbox = chunk.segments[i].bbox
    minLeft = Math.min(minLeft, bbox.left)
    minTop = Math.min(minTop, bbox.top)
    maxRight = Math.max(maxRight, bbox.left + bbox.width)
    maxBottom = Math.max(maxBottom, bbox.top + bbox.height)
  }

  return {
    left: minLeft,
    top: minTop,
    width: maxRight - minLeft,
    height: maxBottom - minTop,
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
