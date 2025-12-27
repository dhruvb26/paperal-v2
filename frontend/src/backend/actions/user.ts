'use server'

import { auth } from '@clerk/nextjs/server'
import { Result, err, ok } from 'neverthrow'
import { SerializableError } from '@/utils/server-result'

export async function validateUser(): Promise<
  Result<string, SerializableError>
> {
  const { userId } = await auth()

  if (!userId) {
    return err({
      type: 'unauthorized',
      message: 'Unauthorized',
      stack: new Error().stack,
    })
  }

  return ok(userId)
}
