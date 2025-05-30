export type Chunk = {
  id: string
  namespace: string
  text: string
  bbox: {
    top: number
    left: number
    width: number
    height: number
  }
  page?: number
  createdAt: Date
}

interface OCRObject {
  bbox: {
    left: number
    top: number
    width: number
    height: number
  }
  confidence: number
  text: string
}

export type ChunkrAPISegment = {
  bbox: {
    left: number
    top: number
    width: number
    height: number
  }
  confidence: number
  content: string
  html: string
  markdown: string
  page_height: number
  page_width: number
  segment_id: string
  segment_type: string
  page_number: number
  llm: string | null
  image: string | null
  ocr: OCRObject[]
}

export type ChunkrAPIChunk = {
  chunk_id: string
  chunk_length: number
  segments: ChunkrAPISegment[]
  embed: string
}
