import { sql } from 'drizzle-orm'
import { check, index, integer, snakeCase, text } from 'drizzle-orm/sqlite-core'

const conversationStatusValues = ['active', 'archived', 'deleted'] as const

export const projects = snakeCase.table(
    'projects',
    {
        createdAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
        id: text().primaryKey(),
        instructions: text().notNull().default(''),
        name: text().notNull(),
        updatedAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('projects_updated_at_idx').on(table.updatedAt),
        check(
            'projects_instructions_check',
            sql`length(${table.instructions}) <= 20000`
        ),
        check(
            'projects_name_check',
            sql`length(${table.name}) between 1 and 200`
        ),
    ]
)

export const conversations = snakeCase.table(
    'conversations',
    {
        createdAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
        id: text().primaryKey(),
        isPinned: integer({ mode: 'boolean' }).notNull().default(false),
        metadata: text({ mode: 'json' })
            .notNull()
            .default(sql`'{}'`),
        model: text(),
        projectId: text().references(() => projects.id, {
            onDelete: 'cascade',
        }),
        status: text({
            enum: conversationStatusValues,
        })
            .notNull()
            .default('active'),
        title: text(),
        updatedAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('conversations_status_is_pinned_updated_at_idx').on(
            table.status,
            table.isPinned,
            table.updatedAt
        ),
        index('conversations_project_id_status_is_pinned_updated_at_idx').on(
            table.projectId,
            table.status,
            table.isPinned,
            table.updatedAt
        ),
        check(
            'conversations_status_check',
            sql`${table.status} in ('active', 'archived', 'deleted')`
        ),
        check(
            'conversations_metadata_json_check',
            sql`json_valid(${table.metadata}) and json_type(${table.metadata}) = 'object'`
        ),
    ]
)
