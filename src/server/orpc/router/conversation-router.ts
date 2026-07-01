import { ORPCError } from '@orpc/server'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'
import { baseProcedure } from '@/server/orpc/base'

const idSchema = z.string().min(1)
const titleSchema = z.string().max(200).nullable()
const modelSchema = z.string().max(120).nullable()
const metadataSchema = z.record(z.string(), z.json())
const statusSchema = z.enum(['active', 'archived', 'deleted'])

interface GetConversationRecordByIdOptions {
    includeDeleted?: boolean
}

const getConversationRecordById = async (
    conversationId: string,
    options: GetConversationRecordByIdOptions = {}
) => {
    const whereClause = options.includeDeleted
        ? eq(conversations.id, conversationId)
        : and(
              eq(conversations.id, conversationId),
              isNull(conversations.deletedAt)
          )

    const [conversationRecord] = await database
        .select()
        .from(conversations)
        .where(whereClause)
        .limit(1)

    if (!conversationRecord) {
        throw new ORPCError('NOT_FOUND')
    }

    return conversationRecord
}

const conversationRouter = {
    create: baseProcedure
        .input(
            z.object({
                id: idSchema.max(255),
                metadata: metadataSchema.default({}),
                model: modelSchema.default(null),
                title: titleSchema.default(null),
            })
        )
        .handler(async ({ input }) => {
            const [conversationRecord] = await database
                .insert(conversations)
                .values({
                    id: input.id,
                    metadata: input.metadata,
                    model: input.model,
                    title: input.title,
                })
                .onConflictDoNothing({ target: conversations.id })
                .returning()

            if (!conversationRecord) {
                throw new ORPCError('CONFLICT')
            }

            return conversationRecord
        }),
    delete: baseProcedure
        .input(z.object({ id: idSchema }))
        .handler(async ({ input }) => {
            const [deletedConversation] = await database
                .update(conversations)
                .set({
                    deletedAt: new Date(),
                    status: 'deleted',
                })
                .where(
                    and(
                        eq(conversations.id, input.id),
                        isNull(conversations.deletedAt)
                    )
                )
                .returning()

            if (!deletedConversation) {
                throw new ORPCError('NOT_FOUND')
            }

            return deletedConversation
        }),
    find: baseProcedure
        .input(z.object({ id: idSchema }))
        .handler(async ({ input }) => {
            const conversationRecord = await getConversationRecordById(input.id)

            return conversationRecord
        }),
    list: baseProcedure
        .input(
            z.object({
                includeDeleted: z.boolean().default(false),
                limit: z.number().int().min(1).max(100).default(50),
            })
        )
        .handler(({ input }) => {
            if (input.includeDeleted) {
                return database
                    .select()
                    .from(conversations)
                    .orderBy(desc(conversations.updatedAt))
                    .limit(input.limit)
            }

            return database
                .select()
                .from(conversations)
                .where(isNull(conversations.deletedAt))
                .orderBy(desc(conversations.updatedAt))
                .limit(input.limit)
        }),
    update: baseProcedure
        .input(
            z.object({
                id: idSchema,
                metadata: metadataSchema.optional(),
                model: modelSchema.optional(),
                status: statusSchema.exclude(['deleted']).optional(),
                title: titleSchema.optional(),
            })
        )
        .handler(async ({ input }) => {
            const existingConversation = await getConversationRecordById(
                input.id
            )

            if (
                input.metadata === undefined &&
                input.model === undefined &&
                input.status === undefined &&
                input.title === undefined
            ) {
                return existingConversation
            }

            let archivedAt: Date | null | undefined

            if (
                input.status === 'archived' &&
                existingConversation.status !== 'archived'
            ) {
                archivedAt = new Date()
            }

            if (input.status === 'active') {
                archivedAt = null
            }

            const [updatedConversation] = await database
                .update(conversations)
                .set({
                    archivedAt,
                    metadata: input.metadata,
                    model: input.model,
                    status: input.status,
                    title: input.title,
                })
                .where(
                    and(
                        eq(conversations.id, input.id),
                        isNull(conversations.deletedAt)
                    )
                )
                .returning()

            if (!updatedConversation) {
                throw new ORPCError('NOT_FOUND')
            }

            return updatedConversation
        }),
}

export default conversationRouter
