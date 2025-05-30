import { PageDimensions } from '@/types/file'
import { ChunkrAPIChunk, ChunkrAPISegment } from '@/types/chunk'

function hasDateInContent(content: string): boolean {
  const datePattern =
    /(?:\d{4}|(?:\d{1,2}\s)?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s?\d{4})/i
  return datePattern.test(content)
}

function getMostFrequentPageNumber(segments: ChunkrAPISegment[]): number {
  const pageCount: { [key: number]: number } = {}
  let maxCount = 0
  let mostFrequentPage = 1 // default to 1 if no page numbers found

  segments.forEach((segment) => {
    if (segment.page_number) {
      const page = segment.page_number
      pageCount[page] = (pageCount[page] || 0) + 1

      if (pageCount[page] > maxCount) {
        maxCount = pageCount[page]
        mostFrequentPage = page
      }
    }
  })

  return mostFrequentPage
}

export async function processChunks(chunks: ChunkrAPIChunk[]) {
  let title = ''
  let info = ''

  for (const chunk of chunks.slice(0, 15)) {
    for (const segment of chunk.segments) {
      if (segment.segment_type === 'Title') {
        title = segment.content
      } else if (
        segment.segment_type === 'PageFooter' ||
        segment.segment_type === 'PageHeader' ||
        hasDateInContent(segment.content)
      ) {
        info += segment.content
        break
      }
    }
  }

  const allPageDimensions: PageDimensions = {}

  for (const chunk of chunks) {
    for (const segment of chunk.segments) {
      const pageNumber = segment.page_number

      if (
        !allPageDimensions[pageNumber] &&
        segment.page_width &&
        segment.page_height
      ) {
        allPageDimensions[pageNumber] = {
          page_width: segment.page_width,
          page_height: segment.page_height,
        }
      }
    }
  }

  const finalChunks = chunks
    .map((chunk: ChunkrAPIChunk) => {
      return {
        _id: chunk.chunk_id,
        text: chunk.embed,
        page: getMostFrequentPageNumber(chunk.segments),
      }
    })
    .filter((chunk) => chunk.text.length > 0)

  return {
    title,
    info,
    chunks: finalChunks,
    pageDimensions: allPageDimensions,
  }
}
