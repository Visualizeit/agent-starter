import { sql } from 'drizzle-orm'
import {
    check,
    index,
    integer,
    sqliteTable,
    text,
} from 'drizzle-orm/sqlite-core'

const conversationStatusValues = ['active', 'archived', 'deleted'] as const

export const conversations = sqliteTable(
    'conversations',
    {
        archivedAt: integer('archived_at', { mode: 'timestamp_ms' }),
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
        id: text('id').primaryKey(),
        metadata: text('metadata', { mode: 'json' })
            .notNull()
            .default(sql`'{}'`),
        model: text('model'),
        status: text('status', {
            enum: conversationStatusValues,
        })
            .notNull()
            .default('active'),
        title: text('title'),
        updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('conversations_deleted_at_updated_at_idx').on(
            table.deletedAt,
            table.updatedAt
        ),
        index('conversations_status_updated_at_idx').on(
            table.status,
            table.updatedAt
        ),
        check(
            'conversations_status_check',
            sql`${table.status} in ('active', 'archived', 'deleted')`
        ),
        check(
            'conversations_metadata_json_check',
            sql`json_valid(${table.metadata})`
        ),
    ]
)
