import { logger, task } from '@trigger.dev/sdk/v3'
import { processCitationsAndChunks } from '@/backend/actions/graph'
import { extractReferences } from '@/utils/extract-references'
import { ChunkrAPIChunk } from '@/types/chunk'

interface PopulateNeo4jPayload {
  taskId: string // The taskId of chunker
  chunks: ChunkrAPIChunk[] // from chunkr
}

export const populateNeo4jTask = task({
  id: 'populate-neo4j',
  run: async (payload: PopulateNeo4jPayload) => {
    try {
      const references = await extractReferences(payload.chunks)

      await processCitationsAndChunks(
        references,
        payload.chunks,
        payload.taskId
      )

      return {
        message: `Neo4j populated successfully for task ${payload.taskId}`,
      }
    } catch (error) {
      logger.error('Error: ', { error })
      throw new Error('Error processing the file')
    }
  },
})
