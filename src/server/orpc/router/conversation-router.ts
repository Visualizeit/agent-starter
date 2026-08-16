import { eq } from 'drizzle-orm'
import { createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { z } from 'zod'

import { conversationTitleSchema } from '@/schemas/rename-conversation-schema'
import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'

import base from '../base'

const idSchema = z.string().min(1)
const metadataSchema = z.record(z.string(), z.json())
const conversationSelectSchema = createSelectSchema(conversations, {
    metadata: metadataSchema,
})
const conversationStatusSchema = conversationSelectSchema.shape.status
const conversationUpdateSchema = createUpdateSchema(conversations, {
    metadata: metadataSchema.optional(),
    title: conversationTitleSchema.optional(),
})

const conversationRouter = {
    delete: base
        .input(z.object({ id: idSchema }))
        .handler(async ({ errors, input }) => {
            const [deletedConversation] = await database
                .update(conversations)
                .set({
                    status: 'deleted',
                })
                .where(eq(conversations.id, input.id))
                .returning()

            if (isNil(deletedConversation)) {
                throw errors.NOT_FOUND()
            }

            return deletedConversation
        }),
    find: base
        .input(z.object({ id: idSchema }))
        .handler(async ({ errors, input }) => {
            const conversationRecord =
                await database.query.conversations.findFirst({
                    where: {
                        id: input.id,
                    },
                    with: {
                        project: true,
                    },
                })

            if (isNil(conversationRecord)) {
                throw errors.NOT_FOUND()
            }

            return conversationRecord
        }),
    list: base
        .input(
            z.object({
                projectId: idSchema.optional(),
                status: conversationStatusSchema,
            })
        )
        .handler(async ({ input }) => {
            const records = await database.query.conversations.findMany({
                orderBy: {
                    isPinned: 'desc',
                    updatedAt: 'desc',
                },
                where: {
                    ...(isNotNil(input.projectId)
                        ? { projectId: input.projectId }
                        : { projectId: { isNull: true } }),
                    status: input.status,
                },
            })

            return { list: records }
        }),
    update: base
        .input(
            conversationUpdateSchema
                .pick({
                    isPinned: true,
                    metadata: true,
                    title: true,
                })
                .extend({
                    id: idSchema,
                    status: conversationStatusSchema
                        .exclude(['deleted'])
                        .optional(),
                })
        )
        .handler(async ({ input, errors }) => {
            const [updatedConversation] = await database
                .update(conversations)
                .set({
                    isPinned: input.isPinned,
                    metadata: input.metadata,
                    status: input.status,
                    title: input.title,
                })
                .where(eq(conversations.id, input.id))
                .returning()

            if (isNil(updatedConversation)) {
                throw errors.NOT_FOUND()
            }

            return updatedConversation
        }),
}

export default conversationRouter
