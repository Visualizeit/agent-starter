import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

import { requestRunCancel } from '@tanstack/ai'
import { defineAIPersistence } from '@tanstack/ai-persistence'
import { runPersistenceConformance } from '@tanstack/ai-persistence/testkit'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import { afterAll, describe, expect, it } from 'vite-plus/test'
import { z } from 'zod'

import createChatMetadataStore from '@/server/ai/create-chat-metadata-store'
import createChatRunStore from '@/server/ai/create-chat-run-store'
import { aiChatRuns, aiChatThreads, conversations } from '@/server/db/schema'

const connections: DatabaseSync[] = []
const temporaryDirectory = mkdtempSync(
    path.join(tmpdir(), 'agent-starter-stores-')
)

const openStores = (filename = ':memory:') => {
    const connection = new DatabaseSync(filename)

    connections.push(connection)

    const database = drizzle({ client: connection })

    migrate(database, { migrationsFolder: './drizzle' })
    database
        .insert(conversations)
        .values(
            ['thread-1', 'thread-active', 'thread-other', 'nc-t'].map((id) => ({
                id,
            }))
        )
        .onConflictDoNothing()
        .run()

    return {
        connection,
        database,
        stores: {
            metadata: createChatMetadataStore(database),
            runs: createChatRunStore(database),
        },
    }
}

afterAll(() => {
    for (const connection of connections) {
        if (connection.isOpen) {
            connection.close()
        }
    }

    rmSync(temporaryDirectory, { force: true, recursive: true })
})

runPersistenceConformance(
    'Drizzle runs and metadata',
    () => defineAIPersistence({ stores: openStores().stores }),
    {
        skip: [
            'messages',
            'interrupts',
            'generationRuns',
            'artifacts',
            'blobs',
        ],
        skipMethods: ['runs.listByThread', 'runs.listReclaimable'],
    }
)

describe('durable chat stores', () => {
    it('adds the stores to an existing database without changing its transcript', () => {
        const baselineMigrations = path.join(
            temporaryDirectory,
            'baseline-migrations'
        )

        mkdirSync(baselineMigrations)
        for (const migration of readdirSync('drizzle')) {
            if (migration < '20260923064359_chat_stores') {
                cpSync(
                    path.join('drizzle', migration),
                    path.join(baselineMigrations, migration),
                    { recursive: true }
                )
            }
        }

        const connection = new DatabaseSync(':memory:')

        connections.push(connection)

        const database = drizzle({ client: connection })

        migrate(database, { migrationsFolder: baselineMigrations })
        database.insert(conversations).values({ id: 'existing-thread' }).run()
        database
            .insert(aiChatThreads)
            .values({
                messages: [{ content: 'Existing message', role: 'user' }],
                threadId: 'existing-thread',
            })
            .run()
        migrate(database, { migrationsFolder: './drizzle' })

        expect(database.select().from(aiChatThreads).all()).toEqual([
            {
                messages: [{ content: 'Existing message', role: 'user' }],
                threadId: 'existing-thread',
            },
        ])
        expect(database.select().from(aiChatRuns).all()).toEqual([])
    })

    it('preserves optional fields and clears only explicit undefined patches', async () => {
        const { stores } = openStores()
        const run = {
            runId: 'patch-run',
            startedAt: 1000,
            threadId: 'thread-1',
        }

        await stores.runs.createOrResume(run)
        await stores.runs.update(run.runId, {
            cancelRequested: true,
            detachedSince: 2000,
            driverEpoch: 0,
            error: { code: 'provider_error', message: 'Failed' },
            finishedAt: 3000,
            sandboxKey: 'sandbox-1',
            usage: { completionTokens: 2, promptTokens: 3, totalTokens: 5 },
        })
        await stores.runs.update(run.runId, { cancelRequested: false })

        expect(await stores.runs.get(run.runId)).toMatchObject({
            cancelRequested: false,
            detachedSince: 2000,
            driverEpoch: 0,
            error: { code: 'provider_error', message: 'Failed' },
            finishedAt: 3000,
            sandboxKey: 'sandbox-1',
            usage: { completionTokens: 2, promptTokens: 3, totalTokens: 5 },
        })

        await stores.runs.update(run.runId, {
            cancelRequested: undefined,
            detachedSince: undefined,
            driverEpoch: undefined,
            error: undefined,
            finishedAt: undefined,
            sandboxKey: undefined,
            usage: undefined,
        })

        expect(await stores.runs.get(run.runId)).toEqual({
            ...run,
            cancelRequested: undefined,
            detachedSince: undefined,
            driverEpoch: undefined,
            error: undefined,
            finishedAt: undefined,
            sandboxKey: undefined,
            status: 'running',
            usage: undefined,
        })
        await expect(stores.runs.update(run.runId, {})).resolves.toBeUndefined()
        await expect(
            stores.runs.update(run.runId, { status: undefined })
        ).resolves.toBeUndefined()
        expect(await stores.runs.get(run.runId)).toMatchObject({
            status: 'running',
        })
        await expect(stores.runs.update('unknown', {})).resolves.toBeUndefined()
    })

    it('persists cancellation intent without changing the run status', async () => {
        const { stores } = openStores()

        await stores.runs.createOrResume({
            runId: 'cancel-run',
            startedAt: 1,
            threadId: 'thread-1',
        })
        await requestRunCancel(stores.runs, 'cancel-run')

        expect(await stores.runs.get('cancel-run')).toMatchObject({
            cancelRequested: true,
            status: 'running',
        })
    })

    it('excludes interrupted runs and resolves equal start times consistently', async () => {
        const { stores } = openStores()

        await Promise.all(
            ['equal-a', 'equal-b'].map(
                async (runId) =>
                    await stores.runs.createOrResume({
                        runId,
                        startedAt: 1,
                        threadId: 'thread-1',
                    })
            )
        )

        expect(await stores.runs.findActiveRun('thread-1')).toMatchObject({
            runId: 'equal-b',
        })
        await stores.runs.update('equal-b', { status: 'interrupted' })
        expect(await stores.runs.findActiveRun('thread-1')).toMatchObject({
            runId: 'equal-a',
        })
    })

    it('retains runs on soft delete and cascades on physical conversation deletion', async () => {
        const { database, stores } = openStores()

        await stores.runs.createOrResume({
            runId: 'delete-run',
            startedAt: 1,
            threadId: 'thread-1',
        })
        await database
            .update(conversations)
            .set({ status: 'deleted' })
            .where(eq(conversations.id, 'thread-1'))
        expect(await stores.runs.get('delete-run')).not.toBeNull()
        await database
            .delete(conversations)
            .where(eq(conversations.id, 'thread-1'))
        expect(await stores.runs.get('delete-run')).toBeNull()
    })

    it('rejects invalid persisted statuses', async () => {
        const { connection, stores } = openStores()

        await stores.runs.createOrResume({
            runId: 'invalid-run',
            startedAt: 1,
            threadId: 'thread-1',
        })
        expect(() => {
            connection.exec("UPDATE ai_chat_runs SET status = 'invalid'")
        }).toThrow()

        connection.exec('PRAGMA ignore_check_constraints = ON')
        connection.exec("UPDATE ai_chat_runs SET status = 'invalid'")
        await expect(stores.runs.get('invalid-run')).rejects.toThrow(z.ZodError)
    })

    it.each(['error', 'usage'] as const)(
        'rejects malformed persisted %s',
        async (field) => {
            const { connection, stores } = openStores()

            await stores.runs.createOrResume({
                runId: 'invalid-json-run',
                startedAt: 1,
                threadId: 'thread-1',
            })
            connection.exec(`UPDATE ai_chat_runs SET ${field} = '{}'`)
            await expect(stores.runs.get('invalid-json-run')).rejects.toThrow(
                z.ZodError
            )
        }
    )

    it('preserves provider usage extensions', async () => {
        const { stores } = openStores()
        const usage = {
            completionTokens: 2,
            promptTokens: 3,
            totalTokens: 5,
            providerDetails: { cachedTokens: 1 },
        }

        await stores.runs.createOrResume({
            runId: 'usage-run',
            startedAt: 1,
            threadId: 'thread-1',
        })
        await stores.runs.update('usage-run', { usage })
        expect(await stores.runs.get('usage-run')).toMatchObject({ usage })
    })

    it('accepts identifiers at their length limits', async () => {
        const { database, stores } = openStores()
        const identifier = 'a'.repeat(256)
        const metadataKey = 'k'.repeat(1024)

        await database.insert(conversations).values({ id: identifier })
        await stores.runs.createOrResume({
            runId: identifier,
            startedAt: 1,
            threadId: identifier,
        })
        expect(await stores.runs.findActiveRun(identifier)).toMatchObject({
            runId: identifier,
        })
        await stores.metadata.set(identifier, metadataKey, { valid: true })
        expect(await stores.metadata.get(identifier, metadataKey)).toEqual({
            valid: true,
        })
    })

    it.each(['', 'a'.repeat(257)])(
        'rejects empty or oversized run identifiers (%#. case)',
        async (identifier) => {
            const { connection, database, stores } = openStores()

            await expect(
                stores.runs.createOrResume({
                    runId: identifier,
                    startedAt: 1,
                    threadId: 'thread-1',
                })
            ).rejects.toThrow(z.ZodError)
            await expect(stores.runs.get(identifier)).rejects.toThrow(
                z.ZodError
            )
            await expect(stores.runs.update(identifier, {})).rejects.toThrow(
                z.ZodError
            )
            await expect(stores.runs.findActiveRun(identifier)).rejects.toThrow(
                z.ZodError
            )
            await expect(
                stores.runs.createOrResume({
                    runId: 'invalid-thread-run',
                    startedAt: 1,
                    threadId: identifier,
                })
            ).rejects.toThrow(z.ZodError)
            expect(() => {
                connection
                    .prepare(
                        'INSERT INTO ai_chat_runs (run_id, thread_id, started_at) VALUES (?, ?, 1)'
                    )
                    .run(identifier, 'thread-1')
            }).toThrow('CHECK constraint failed')
            await database.insert(conversations).values({ id: identifier })
            expect(() => {
                connection
                    .prepare(
                        'INSERT INTO ai_chat_runs (run_id, thread_id, started_at) VALUES (?, ?, 1)'
                    )
                    .run('invalid-thread-run', identifier)
            }).toThrow('CHECK constraint failed')
        }
    )

    it.each([
        { key: 'key', namespace: '' },
        { key: 'key', namespace: 'n'.repeat(257) },
        { key: '', namespace: 'values' },
        { key: 'k'.repeat(1025), namespace: 'values' },
    ])(
        'rejects invalid metadata identities (%#. case)',
        async ({ key, namespace }) => {
            const { connection, stores } = openStores()

            await expect(
                stores.metadata.set(namespace, key, {})
            ).rejects.toThrow(z.ZodError)
            await expect(stores.metadata.get(namespace, key)).rejects.toThrow(
                z.ZodError
            )
            await expect(
                stores.metadata.delete(namespace, key)
            ).rejects.toThrow(z.ZodError)
            expect(() => {
                connection
                    .prepare(
                        "INSERT INTO ai_chat_metadata (namespace, key, value) VALUES (?, ?, '{}')"
                    )
                    .run(namespace, key)
            }).toThrow('CHECK constraint failed')
        }
    )

    it('keeps records across connection replacement and shares updates between connections', async () => {
        const filename = path.join(temporaryDirectory, 'restart.db')
        const first = openStores(filename)

        await first.stores.runs.createOrResume({
            runId: 'durable-run',
            startedAt: 1,
            threadId: 'thread-1',
        })
        await first.stores.runs.update('durable-run', { cancelRequested: true })
        await first.stores.metadata.set('compaction', 'thread-1', {
            summary: 'Persisted summary',
        })
        first.connection.close()

        const reopened = openStores(filename)
        const other = openStores(filename)

        expect(
            await reopened.stores.runs.findActiveRun('thread-1')
        ).toMatchObject({
            cancelRequested: true,
            runId: 'durable-run',
        })
        expect(
            await reopened.stores.metadata.get('compaction', 'thread-1')
        ).toEqual({
            summary: 'Persisted summary',
        })
        await reopened.stores.runs.update('durable-run', {
            status: 'completed',
        })
        const existing = await other.stores.runs.createOrResume({
            runId: 'durable-run',
            startedAt: 999,
            threadId: 'thread-other',
        })

        expect(existing).toMatchObject({
            startedAt: 1,
            status: 'completed',
            threadId: 'thread-1',
        })
        expect(await other.stores.runs.findActiveRun('thread-1')).toBeNull()
        const rows = await other.database.select().from(aiChatRuns)

        expect(rows).toHaveLength(1)
    })

    it.each([false, 0, '', null, [1, 'two'], { nested: [false, null] }])(
        'round-trips JSON metadata %j',
        async (value) => {
            const { database, stores } = openStores()

            await stores.metadata.set('values', 'key', value)
            expect(await stores.metadata.get('values', 'key')).toEqual(value)
            // No thread ownership is inferred from a generic namespace/key pair.
            await database.delete(conversations)
            expect(await stores.metadata.get('values', 'key')).toEqual(value)
            await stores.metadata.delete('values', 'key')
            await stores.metadata.delete('values', 'key')
            expect(await stores.metadata.get('values', 'key')).toBeNull()
        }
    )

    it('rejects non-JSON metadata without replacing an existing value', async () => {
        const { stores } = openStores()

        await stores.metadata.set('values', 'key', { valid: true })
        await expect(
            stores.metadata.set('values', 'key', undefined)
        ).rejects.toThrow()
        await expect(
            stores.metadata.set('values', 'key', Number.NaN)
        ).rejects.toThrow()
        await expect(stores.metadata.set('values', 'key', 1n)).rejects.toThrow()
        const value = await stores.metadata.get('values', 'key')

        expect(value).toEqual({ valid: true })
    })
})
