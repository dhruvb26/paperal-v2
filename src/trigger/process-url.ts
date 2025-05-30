import { processChunks } from '@/utils/process-chunks'
import { Pinecone } from '@pinecone-database/pinecone'
import { uploadFile } from '@/backend/actions/file'
import { logger, task, wait } from '@trigger.dev/sdk/v3'
import { nanoid } from 'nanoid'
import { processChunksWithBBox } from '@/utils/bbox-utils'
import { createChunks } from '@/backend/actions/chunk'
import { getMeConfig } from '@/utils/chunking-config'
import { addToLibrary } from '@/backend/actions/library'
// import { processCitationsAndChunks } from '@/backend/actions/graph'

interface ProcessUrlPayload {
  url: string
  userId: string
  saveToLibrary?: boolean
}

export const processUrlTask = task({
  id: 'process-url',
  maxDuration: 6000,
  run: async (payload: ProcessUrlPayload) => {
    try {
      logger.log(`Processing url: ${payload.url}`)

      const CHUNKR_API_KEY = process.env.CHUNKR_API_KEY!
      const PINECONE_API_KEY = process.env.PINECONE_API_KEY!
      const PINECONE_INDEX_NAME = 'paperal'
      const PINECONE_INDEX_HOST =
        'https://paperal-vt9kq6y.svc.aped-4627-b74a.pinecone.io'
      const PINECONE_SPARSE_INDEX_HOST =
        'https://paperal-sparse-vt9kq6y.svc.aped-4627-b74a.pinecone.io'
      const GEMINI_API_ENDPOINT =
        'https://generativelanguage.googleapis.com/v1beta/models'
      const DEFAULT_MODEL = 'gemini-2.0-flash'
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY!

      const pc = new Pinecone({
        apiKey: PINECONE_API_KEY,
      })

      const MAX_RETRIES = 30
      const DELAY_MS = 2
      let retries = 0

      const body = getMeConfig(payload.url)

      const parseResponse = await fetch(
        'https://api.chunkr.ai/api/v1/task/parse',
        {
          method: 'POST',
          headers: {
            Authorization: CHUNKR_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )
      const parsedData = await parseResponse.json()
      const taskId = parsedData.task_id

      await wait.for({ seconds: 10 })

      let outputChunks = []

      while (retries < MAX_RETRIES) {
        const response = await fetch(
          `https://api.chunkr.ai/api/v1/task/${taskId}`,
          { method: 'GET', headers: { Authorization: CHUNKR_API_KEY } }
        )
        const data = await response.json()
        outputChunks = data.output.chunks

        if (outputChunks && outputChunks.length > 0) {
          break
        }

        logger.log(`No chunks found on attempt ${retries + 1}.`)

        await wait.for({ seconds: DELAY_MS * (1 + retries) })
        retries++
      }

      if (outputChunks.length === 0) {
        throw new Error('Failed to get chunks after maximum retries')
      }

      const processed = await processChunks(outputChunks)

      const { title, info, chunks, pageDimensions } = processed

      const geminiPayload = {
        contents: [
          {
            parts: [
              {
                text: `Based on the following document excerpt, extract the title, authors, a short description, year of publication, and create an APA style in-text citation.
                    Return the information in a valid JSON format with these exact keys: title, description, authors (as list), citations.in_text, year
    
                    If you cannot determine any field with high confidence, use null for that field.
    
                    Document excerpt:
                    ${info}
    
                    Example output format:
                    {
                        "title": "The Impact of AI on Modern Society",
                        "description": "The Impact of AI on Modern Society is a paper that discusses the impact of AI on modern society. It is a paper that was published in 2024.",
                        "authors": ["Smith, J.", "Jones, K."],
                        "citations": {
                            "in_text": "(Smith & Jones, 2024)"
                        },
                        "year": "2024"
                    }`,
              },
            ],
          },
        ],
      }

      const response = await fetch(
        `${GEMINI_API_ENDPOINT}/${DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geminiPayload),
        }
      )

      const data = await response.json()

      const dataMetadata = JSON.parse(
        data.candidates[0].content.parts[0].text
          .replace('```json', '')
          .replace('```', '')
          .trim()
      )

      const metadata = {
        title: dataMetadata.title,
        file_url: payload.url,
        authors: dataMetadata.authors,
        citations: dataMetadata.citations,
        year: dataMetadata.year,
      }

      if (payload.saveToLibrary) {
        try {
          await addToLibrary(data.title, data.description, metadata)

          const denseIndex = pc
            .index('paperal', PINECONE_INDEX_HOST)
            .namespace('library')

          const sparseIndex = pc
            .index('paperal-sparse', PINECONE_SPARSE_INDEX_HOST)
            .namespace('library')

          const pineconeUpserts = []
          for (let i = 0; i < chunks.length; i += 96) {
            const batch = chunks.slice(i, i + 96)
            pineconeUpserts.push(denseIndex.upsertRecords(batch))
            pineconeUpserts.push(sparseIndex.upsertRecords(batch))
          }

          return {
            message: 'Processed the file successfully.',
          }
        } catch (error) {
          logger.error('Error: ', { error })
          throw new Error('Error processing the file')
        }
      }

      const namespace = `${processed.title
        .replace(/\s+/g, '-')
        .toLowerCase()}-${nanoid(10)}`

      const chunksWithBBox = processChunksWithBBox(outputChunks, namespace)

      const denseIndex = pc
        .index(PINECONE_INDEX_NAME, PINECONE_INDEX_HOST)
        .namespace(namespace)

      const pineconeUpserts = []
      for (let i = 0; i < chunks.length; i += 96) {
        const batch = chunks.slice(i, i + 96)
        pineconeUpserts.push(denseIndex.upsertRecords(batch))
      }

      await Promise.all([
        Promise.all(pineconeUpserts),
        createChunks(chunksWithBBox),
        uploadFile(
          payload.userId,
          payload.url,
          title,
          info,
          namespace,
          pageDimensions
        ),
        addToLibrary(title, info, metadata, payload.userId),
        // TODO: Uncomment this when the citations are available
        // processCitationsAndChunks(metadata.citations, outputChunks, taskId),
      ])

      return {
        message: 'Processed the file successfully.',
      }
    } catch (error) {
      logger.error('Error: ', { error })
      throw new Error('Error processing the file')
    }
  },
})
