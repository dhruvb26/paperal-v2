import { type Result } from 'neverthrow'

export interface SerializableError {
  type: string
  message: string
  stack?: string
}

export type ServerResult<T, E> = { value: T } | { error: E }

export function serverResult<T, E>(result: Result<T, E>): ServerResult<T, E> {
  return result.isOk() ? { value: result.value } : { error: result.error }
}
