import { defineRunStore } from '@tanstack/ai'
import type { RunRecord } from '@tanstack/ai'
import { and, desc, eq } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import { mapValues, omitBy } from 'es-toolkit'
import { isEmpty } from 'es-toolkit/compat'
import { isUndefined } from 'es-toolkit/predicate'
import { invariant } from 'es-toolkit/util'
import { z } from 'zod'

import type database from '@/server/db/client'
import { aiChatRuns } from '@/server/db/schema'

const runRowSchema = createSelectSchema(aiChatRuns, {
    error: z
        .looseObject({ code: z.string().optional(), message: z.string() })
        .nullable(),
    runId: (schema) => schema.min(1),
    threadId: (schema) => schema.min(1),
    // Keep provider-specific usage fields intact as the upstream contract evolves.
    usage: z
        .looseObject({
            completionTokens: z.number(),
            promptTokens: z.number(),
            totalTokens: z.number(),
        })
        .nullable(),
})

const runRecordSchema = runRowSchema.transform((record): RunRecord => ({
    ...record,
    cancelRequested: record.cancelRequested ?? undefined,
    detachedSince: record.detachedSince ?? undefined,
    driverEpoch: record.driverEpoch ?? undefined,
    error: record.error ?? undefined,
    finishedAt: record.finishedAt ?? undefined,
    sandboxKey: record.sandboxKey ?? undefined,
    usage: record.usage ?? undefined,
}))

const createRunSchema = runRowSchema
    .pick({ runId: true, startedAt: true, status: true, threadId: true })
    .extend({ status: runRowSchema.shape.status.optional() })

const runUpdateSchema = runRowSchema
    .omit({ runId: true, startedAt: true, threadId: true })
    .partial()

const createChatRunStore = (
    storeDatabase: Pick<typeof database, 'insert' | 'select' | 'update'>
) => {
    const get = async (runId: string) => {
        runRowSchema.shape.runId.parse(runId)
        const [record] = await storeDatabase
            .select()
            .from(aiChatRuns)
            .where(eq(aiChatRuns.runId, runId))
            .limit(1)

        return record ? runRecordSchema.parse(record) : null
    }

    return defineRunStore({
        createOrResume: async (input) => {
            const [created] = await storeDatabase
                .insert(aiChatRuns)
                .values(createRunSchema.parse(input))
                .onConflictDoNothing({ target: aiChatRuns.runId })
                .returning()

            if (created) {
                return runRecordSchema.parse(created)
            }

            const existing = await get(input.runId)

            invariant(existing, 'Chat run disappeared while resuming')

            return existing
        },
        findActiveRun: async (threadId) => {
            runRowSchema.shape.threadId.parse(threadId)
            const [record] = await storeDatabase
                .select()
                .from(aiChatRuns)
                .where(
                    and(
                        eq(aiChatRuns.threadId, threadId),
                        eq(aiChatRuns.status, 'running')
                    )
                )
                .orderBy(desc(aiChatRuns.startedAt), desc(aiChatRuns.runId))
                .limit(1)

            return record ? runRecordSchema.parse(record) : null
        },
        get,
        update: async (runId, patch) => {
            runRowSchema.shape.runId.parse(runId)

            // Only supplied keys are mapped; undefined clears nullable fields.
            const changes = omitBy(
                runUpdateSchema.parse(
                    mapValues(patch, (value, key) =>
                        key === 'status' ? value : (value ?? null)
                    )
                ),
                isUndefined
            )

            if (isEmpty(changes)) {
                return
            }

            await storeDatabase
                .update(aiChatRuns)
                .set(changes)
                .where(eq(aiChatRuns.runId, runId))
        },
    })
}

export default createChatRunStore
