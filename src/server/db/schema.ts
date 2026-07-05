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
        createdAt: integer('created_at', { mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        id: text('id').primaryKey(),
        isPinned: integer('is_pinned', { mode: 'boolean' })
            .notNull()
            .default(false),
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
