import { sql } from 'drizzle-orm'
import {
    check,
    index,
    integer,
    snakeCase,
    text,
    uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const conversationStatusValues = ['active', 'archived', 'deleted'] as const
const projectStatusValues = ['active', 'deleted'] as const

export const projects = snakeCase.table(
    'projects',
    {
        createdAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        id: text().primaryKey(),
        name: text().notNull(),
        path: text().notNull(),
        status: text({
            enum: projectStatusValues,
        })
            .notNull()
            .default('active'),
        updatedAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('projects_status_updated_at_idx').on(
            table.status,
            table.updatedAt
        ),
        uniqueIndex('projects_path_unique_idx').on(table.path),
        check('projects_name_check', sql`length(${table.name}) > 0`),
        check('projects_path_check', sql`length(${table.path}) > 0`),
        check(
            'projects_status_check',
            sql`${table.status} in ('active', 'deleted')`
        ),
    ]
)

export const conversations = snakeCase.table(
    'conversations',
    {
        createdAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`),
        id: text().primaryKey(),
        isPinned: integer({ mode: 'boolean' }).notNull().default(false),
        metadata: text({ mode: 'json' })
            .notNull()
            .default(sql`'{}'`),
        model: text(),
        projectId: text().references(() => projects.id),
        status: text({
            enum: conversationStatusValues,
        })
            .notNull()
            .default('active'),
        title: text(),
        updatedAt: integer({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`(unixepoch() * 1000)`)
            .$onUpdate(() => new Date()),
    },
    (table) => [
        index('conversations_status_updated_at_idx').on(
            table.status,
            table.updatedAt
        ),
        index('conversations_project_id_status_updated_at_idx').on(
            table.projectId,
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
