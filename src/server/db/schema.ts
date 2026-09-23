import type {
    ModelMessage,
    RunError,
    RunStatus,
    TokenUsage,
} from '@tanstack/ai'
import { sql } from 'drizzle-orm'
import {
    check,
    index,
    integer,
    primaryKey,
    snakeCase,
    text,
} from 'drizzle-orm/sqlite-core'

const conversationStatusValues = ['active', 'archived', 'deleted'] as const
const runStatusValues = [
    'running',
    'interrupted',
    'completed',
    'failed',
    'aborted',
] as const satisfies readonly RunStatus[]

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

export const aiChatThreads = snakeCase.table(
    'ai_chat_threads',
    {
        messages: text({ mode: 'json' })
            .$type<ModelMessage[]>()
            .notNull()
            .default(sql`'[]'`),
        threadId: text()
            .primaryKey()
            .references(() => conversations.id, {
                onDelete: 'cascade',
            }),
    },
    (table) => [
        check(
            'ai_chat_threads_messages_json_check',
            sql`json_valid(${table.messages}) and json_type(${table.messages}) = 'array'`
        ),
    ]
)

export const aiChatRuns = snakeCase.table(
    'ai_chat_runs',
    {
        cancelRequested: integer({ mode: 'boolean' }),
        detachedSince: integer(),
        driverEpoch: integer(),
        error: text({ mode: 'json' }).$type<RunError>(),
        finishedAt: integer(),
        runId: text({ length: 256 }).primaryKey(),
        sandboxKey: text(),
        startedAt: integer().notNull(),
        status: text({ enum: runStatusValues }).notNull().default('running'),
        threadId: text({ length: 256 })
            .notNull()
            .references(() => conversations.id, { onDelete: 'cascade' }),
        usage: text({ mode: 'json' }).$type<TokenUsage>(),
    },
    (table) => [
        check(
            'ai_chat_runs_run_id_check',
            sql`length(${table.runId}) between 1 and 256`
        ),
        check(
            'ai_chat_runs_thread_id_check',
            sql`length(${table.threadId}) between 1 and 256`
        ),
        index('ai_chat_runs_thread_id_status_started_at_idx').on(
            table.threadId,
            table.status,
            table.startedAt
        ),
        check(
            'ai_chat_runs_status_check',
            sql`${table.status} in ('running', 'interrupted', 'completed', 'failed', 'aborted')`
        ),
        check(
            'ai_chat_runs_error_json_check',
            sql`${table.error} is null or (json_valid(${table.error}) and json_type(${table.error}) = 'object')`
        ),
        check(
            'ai_chat_runs_usage_json_check',
            sql`${table.usage} is null or (json_valid(${table.usage}) and json_type(${table.usage}) = 'object')`
        ),
    ]
)

export const aiChatMetadata = snakeCase.table(
    'ai_chat_metadata',
    {
        key: text({ length: 1024 }).notNull(),
        namespace: text({ length: 256 }).notNull(),
        value: text({ mode: 'json' }).$type<unknown>().notNull(),
    },
    (table) => [
        primaryKey({ columns: [table.namespace, table.key] }),
        check(
            'ai_chat_metadata_namespace_check',
            sql`length(${table.namespace}) between 1 and 256`
        ),
        check(
            'ai_chat_metadata_key_check',
            sql`length(${table.key}) between 1 and 1024`
        ),
        check(
            'ai_chat_metadata_value_json_check',
            sql`json_valid(${table.value})`
        ),
    ]
)
