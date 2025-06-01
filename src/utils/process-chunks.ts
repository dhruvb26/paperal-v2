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

// Function to truncate text to safe size for Pinecone
function truncateTextForPinecone(text: string): string {
  // Pinecone's limit is 40960 bytes per vector
  const MAX_METADATA_SIZE = 20000; // Leaving room for other metadata fields and encoding overhead
  
  // Rough estimate of text size in bytes
  const estimatedSize = new TextEncoder().encode(text).length;
  
  if (estimatedSize <= MAX_METADATA_SIZE) {
    return text;
  }
  
  // Calculate a safe truncation point
  const ratio = MAX_METADATA_SIZE / estimatedSize;
  const safeLength = Math.floor(text.length * ratio * 0.95); // 5% safety margin
  
  return text.substring(0, safeLength);
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
      // use regex to remove | from the text
      const text = chunk.embed.replace(/\|/g, '')
      // Truncate text to safe size for Pinecone
      const safeText = truncateTextForPinecone(text)
      return {
        _id: chunk.chunk_id,
        text: safeText,
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
