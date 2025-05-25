import { sql } from 'drizzle-orm'
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  text,
} from 'drizzle-orm/pg-core'

export const documentsTable = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id').notNull(),
  content: jsonb('content').notNull(),
  prompt: text().notNull(),
  title: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string', precision: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
})

export const filesTable = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  namespace: text().notNull(),
  userId: varchar('user_id').notNull(),
  title: text().notNull(),
  description: text().notNull(),
  fileUrl: varchar('file_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const chunksTable = pgTable('chunks', {
  id: uuid('id').primaryKey(),
  namespace: text().notNull(),
  text: text().notNull(),
  bbox: jsonb('bbox').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const libraryTable = pgTable('library', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id').default(sql`NULL`),
  title: text().notNull(),
  description: text().notNull(),
  metadata: jsonb('metadata').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
