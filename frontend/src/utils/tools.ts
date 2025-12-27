import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { filesTable } from '@/db/schema'
import { Pinecone } from '@pinecone-database/pinecone'
import { tryCatch } from '@/utils/try-catch'

export const getNamespace = async (url: string) => {
  const { data, error } = await tryCatch(
    db
      .select({ namespace: filesTable.namespace })
      .from(filesTable)
      .where(eq(filesTable.fileUrl, url))
  )

  if (error) {
    throw new Error(error.message)
  }

  return data[0].namespace
}

export async function QueryDB(url: string) {
  const { data, error } = await tryCatch(
    db.select().from(filesTable).where(eq(filesTable.fileUrl, url))
  )

  if (error) {
    throw new Error(error.message)
  }

  return data[0]
}

export async function QueryVectorDB(url: string, query: string) {
  const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
  const namespace = await getNamespace(url)

  const dense_namespace = pc
    .index('paperal', 'https://paperal-vt9kq6y.svc.aped-4627-b74a.pinecone.io')
    .namespace(namespace)

  const response = await dense_namespace.searchRecords({
    query: {
      topK: 10,
      inputs: { text: query },
    },
    fields: ['text', '_id', 'page'],
  })

  return response.result.hits.map((hit: any) => ({
    id: hit._id,
    text: hit.fields.text,
    score: hit._score,
    page: hit.fields.page,
  }))
}

export const tools = [
  {
    type: 'function',
    function: {
      name: 'QueryVectorDB',
      description:
        'Search through document chunks semantically using vector similarity. Returns the most relevant text passages from the document that match the given query. Use this to find specific information within a document.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'The natural language query to search for relevant passages in the document',
          },
          url: {
            type: 'string',
            description: 'The URL provided by the user',
          },
        },
        required: ['query', 'namespace'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'QueryDB',
      description:
        'Retrieve metadata and file information about a document. Use this to get details about the document like title, upload date, and other properties.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description:
              'The URL identifier of the document to get information about',
          },
        },
        required: ['url'],
      },
    },
  },
]

export const TOOL_MAPPING = {
  QueryVectorDB: async ({ query, url }: { query: string; url: string }) => {
    const response = await QueryVectorDB(url, query)
    return { response }
  },
  QueryDB: async ({ url }: { url: string }) => {
    const response = await QueryDB(url)
    return { response }
  },
}

export type ToolNames = keyof typeof TOOL_MAPPING
