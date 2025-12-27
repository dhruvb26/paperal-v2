import { Database } from '@/lib/database.types'

type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S

export type SnakeToCamelCase<T> = {
  [K in keyof T as SnakeToCamel<K & string>]: T[K]
}

export type Document = SnakeToCamelCase<
  Omit<
    Database['public']['Tables']['documents']['Row'],
    'created_at' | 'updated_at'
  >
>
