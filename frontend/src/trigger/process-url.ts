import { processChunks } from '@/utils/process-chunks'
import { Pinecone } from '@pinecone-database/pinecone'
import { addFileToDb } from '@/backend/actions/file'
import { logger, task, wait } from '@trigger.dev/sdk/v3'
import { nanoid } from 'nanoid'
import { processChunksWithBBox } from '@/utils/bbox-utils'
import { createChunks } from '@/backend/actions/chunk'
import { getMeConfig } from '@/utils/chunking-config'
import { addToLibrary } from '@/backend/actions/library'
import { populateNeo4jTask } from '@/trigger/populate-neo4j'

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
      const OPENAI_API_KEY = process.env.OPENAI_API_KEY!

      const pc = new Pinecone({
        apiKey: PINECONE_API_KEY,
      })

      logger.log('Pinecone initialized')

      const MAX_RETRIES = 30
      const DELAY_MS = 2
      let retries = 0

      const body = getMeConfig(payload.url)

      logger.log('Body: ', { body })

      const parseResponse = await fetch(
        'https://api.chunkr.ai/tasks/parse',
        {
          method: 'POST',
          headers: {
            Authorization: CHUNKR_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )
      logger.log('Parse response: ', { parseResponse })
      const parsedData = await parseResponse.json()
      logger.log('Parsed data: ', { parsedData })
      const taskId = parsedData.task_id

      await wait.for({ seconds: 10 })

      let outputChunks = []

      while (retries < MAX_RETRIES) {
        logger.log('Getting chunks...')
        const response = await fetch(
          `https://api.chunkr.ai/tasks/${taskId}`,
          { method: 'GET', headers: { Authorization: CHUNKR_API_KEY } }
        )
        const responseData = await response.json()
        logger.log('Response data: ', { responseData })
        
        // Extract the actual task object from the nested response
        const taskData = responseData.data || responseData
        
        logger.log('Task data: ', { 
          completed: taskData.completed,
          status: taskData.status,
          hasOutput: !!taskData.output 
        })
        
        // Check if task is completed
        if (taskData.completed) {
          logger.log('Task completed. Output structure:', { 
            hasOutput: !!taskData.output,
            outputKeys: taskData.output ? Object.keys(taskData.output) : null,
            output: taskData.output 
          })
          
          // Access chunks from the output
          if (taskData.output?.chunks) {
            outputChunks = taskData.output.chunks
            if (outputChunks.length > 0) {
              logger.log(`Found ${outputChunks.length} chunks`)
              break
            }
          } else {
            logger.log('Task completed but no chunks found in output')
          }
        }

        logger.log(`Task status: ${taskData.status}, completed: ${taskData.completed}, attempt ${retries + 1}.`)

        await wait.for({ seconds: DELAY_MS * (1 + retries) })
        retries++
      }

      if (outputChunks.length === 0) {
        throw new Error('Failed to get chunks after maximum retries')
      }

      // Trigger the populateNeo4jTask to populate the Neo4j database
      await populateNeo4jTask.trigger({
        taskId,
        chunks: outputChunks,
      })

      const processed = await processChunks(outputChunks)

      const { title, info, chunks, pageDimensions } = processed

      const openaiPayload = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Based on the following document excerpt, extract the title, authors, a short description, year of publication, and create an APA style in-text citation.
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
      }

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify(openaiPayload),
        }
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        logger.error(
          `OpenAI API call failed: ${response.status} ${response.statusText}`,
          { errorText }
        )
        throw new Error(
          `OpenAI API call failed: ${response.status} ${response.statusText}`
        )
      }

      const data = await response.json()
      logger.log('Data: ', { data })

      let dataMetadata
      try {
        dataMetadata = JSON.parse(
          data.choices[0].message.content
            .replace('```json', '')
            .replace('```', '')
            .trim()
        )
      } catch (error) {
        logger.error('Failed to parse metadata from OpenAI:', { 
          error: error instanceof Error ? error.message : String(error) 
        })
        dataMetadata = {
          title: null,
          description: null,
          authors: [],
          citations: { 'in_text': '' },
          year: '',
        }
      }

      const metadata = {
        title: dataMetadata.title || 'Untitled Document',
        file_url: payload.url,
        authors: dataMetadata.authors || [],
        citations: dataMetadata.citations || { 'in_text': '' },
        year: dataMetadata.year || '',
      }

      if (payload.saveToLibrary) {
        try {
          const title = dataMetadata.title || 'Untitled Document'
          const description = dataMetadata.description || 'No description available'
          
          await addToLibrary(title, description, metadata)

          const denseIndex = pc
            .index('paperal')
            .namespace('library')

          const sparseIndex = pc
            .index('paperal-sparse')
            .namespace('library')

          const pineconeUpserts = []
          for (let i = 0; i < chunks.length; i += 96) {
            const batch = chunks.slice(i, i + 96)
            pineconeUpserts.push(denseIndex.upsertRecords(batch))
            pineconeUpserts.push(sparseIndex.upsertRecords(batch))
          }

          await Promise.all(pineconeUpserts)
          logger.log('Successfully saved documents to Pinecone library')

          return {
            message: 'Processed the file successfully.',
          }
        } catch (error) {
          logger.error('Error: ', { error })
          throw new Error('Error processing the file')
        }
      }

      const namespace = `${processed.title
        .replace(/[^\x00-\x7F]+/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()}-${nanoid(10)}`

      const chunksWithBBox = processChunksWithBBox(outputChunks, namespace)

      const denseIndex = pc
        .index(PINECONE_INDEX_NAME)
        .namespace(namespace)

      const pineconeUpserts = []
      for (let i = 0; i < chunks.length; i += 96) {
        const batch = chunks.slice(i, i + 96)
        pineconeUpserts.push(denseIndex.upsertRecords(batch))
      }
      logger.log('Pinecone upserts: ', { pineconeUpserts })

      await Promise.all([
        Promise.all(pineconeUpserts),
        createChunks(chunksWithBBox),
        addFileToDb(
          payload.userId,
          payload.url,
          title,
          info,
          namespace,
          pageDimensions,
          taskId
        ),
        addToLibrary(
          title || 'Untitled Document',
          info || 'No description available',
          metadata,
          payload.userId
        ),
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