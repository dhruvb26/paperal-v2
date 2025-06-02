'use server'

import { db } from '@/db'
import { documentsTable } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { env } from 'process'
import { ResultAsync, err } from 'neverthrow'
import {
  serverResult,
  SerializableError,
  ServerResult,
} from '@/utils/server-result'
import { validateUser } from '@/backend/actions/user'
import type { Document } from '@/types/db'

const api = env.API_URL!

export async function createDocument(
  prompt: string
): Promise<ServerResult<Document, SerializableError>> {
  const user = await validateUser()

  const result = await user.asyncAndThen((userId: string) => {
    return ResultAsync.fromPromise(
      fetch(`${api}/topic`, {
        method: 'POST',
        body: JSON.stringify({ query: prompt }),
        headers: { 'Content-Type': 'application/json' },
      }),
      (error): SerializableError => ({
        type: 'network',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
      .andThen((response) => {
        if (!response.ok) {
          const errorText = response.text().catch(() => 'Unknown error')
          return err({
            type: 'http',
            message: `API Error: ${response.status} - ${errorText}`,
            stack: new Error().stack,
          })
        }
        return ResultAsync.fromSafePromise(response.json())
      })
      .andThen((topicData) => {
        return ResultAsync.fromPromise(
          searchWeb(topicData.data.main_topic),
          (error): SerializableError => ({
            type: 'network',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
        ).map(() => ({ rawData: topicData.data }))
      })
      .andThen(({ rawData }) => {
        return ResultAsync.fromPromise(
          db
            .insert(documentsTable)
            .values({
              userId,
              title: rawData.main_topic,
              prompt,
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'heading',
                    attrs: { level: 1 },
                    content: [{ type: 'text', text: rawData.main_topic }],
                  },
                  { type: 'paragraph', content: [] },
                ],
              },
            })
            .returning()
            .then((results) => results[0]) as Promise<Document>,
          (error): SerializableError => ({
            type: 'database',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
        )
      })
  })

  return serverResult(result)
}

export async function getDocument(
  id: string
): Promise<ServerResult<Document, SerializableError>> {
  const user = await validateUser()

  const result = await user.asyncAndThen((userId: string) =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(documentsTable)
        .where(
          and(eq(documentsTable.id, id), eq(documentsTable.userId, userId))
        )
        .limit(1)
        .then((results) => results[0]) as Promise<Document>,
      (error): SerializableError => ({
        type: 'database',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
  )

  return serverResult(result)
}

export async function getDocuments(): Promise<
  ServerResult<Document[], SerializableError>
> {
  const user = await validateUser()

  const result = await user.asyncAndThen((userId: string) =>
    ResultAsync.fromPromise(
      db
        .select()
        .from(documentsTable)
        .where(eq(documentsTable.userId, userId)) as Promise<Document[]>,
      (error): SerializableError => ({
        type: 'database',
        message: 'Database query error',
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
  )

  return serverResult(result)
}

export async function deleteDocument(
  id: string
): Promise<ServerResult<Document, SerializableError>> {
  const user = await validateUser()

  const result = await user.asyncAndThen((userId: string) =>
    ResultAsync.fromPromise(
      db
        .delete(documentsTable)
        .where(
          and(eq(documentsTable.id, id), eq(documentsTable.userId, userId))
        )
        .returning()
        .then((results) => results[0]) as Promise<Document>,
      (error): SerializableError => ({
        type: 'database',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
  )

  return serverResult(result)
}

export async function updateDocument(
  id: string,
  data: Partial<Document>
): Promise<ServerResult<Document, SerializableError>> {
  const user = await validateUser()

  const result = await user.asyncAndThen((userId: string) =>
    ResultAsync.fromPromise(
      db
        .update(documentsTable)
        .set(data)
        .where(
          and(eq(documentsTable.id, id), eq(documentsTable.userId, userId))
        )
        .returning()
        .then((results) => results[0]) as Promise<Document>,
      (error): SerializableError => ({
        type: 'database',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
  )

  return serverResult(result)
}

export async function searchWeb(
  main_topic: string
): Promise<ServerResult<any, SerializableError>> {
  const user = await validateUser()

  const result = await user.asyncAndThen(() =>
    ResultAsync.fromPromise(
      fetch(`${api}/search`, {
        method: 'POST',
        body: JSON.stringify({ topic: main_topic }),
        headers: { 'Content-Type': 'application/json' },
      }),
      (error): SerializableError => ({
        type: 'network',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
    )
      .andThen((response) => {
        if (!response.ok) {
          const errorText = response.text().catch(() => 'Unknown error')

          return err({
            type: 'http',
            message: `API Error: ${response.status} - ${errorText}`,
            stack: new Error().stack,
          })
        }
        return ResultAsync.fromSafePromise(response.json())
      })
      .andThen((searchData) => {
        // Make the process request with search results
        return ResultAsync.fromPromise(
          fetch(`${api}/process`, {
            method: 'POST',
            body: JSON.stringify({
              topic: main_topic,
              searchResults: searchData.data,
            }),
            headers: { 'Content-Type': 'application/json' },
          }),
          (error): SerializableError => ({
            type: 'network',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
        ).andThen((processResponse) => {
          if (!processResponse.ok) {
            const errorText = processResponse
              .text()
              .catch(() => 'Unknown error')

            return err({
              type: 'http',
              message: `API Error: ${processResponse.status} - ${errorText}`,
              stack: new Error().stack,
            })
          }
          return ResultAsync.fromSafePromise(processResponse.json())
        })
      })
  )

  return serverResult(result)
}
