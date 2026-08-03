import { and, eq, isNull } from 'drizzle-orm'
import { createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import {
    chatSubmissionSchema,
    modelSchema,
} from '@/schemas/chat-submission-schema'
import { conversationTitleSchema } from '@/schemas/rename-conversation-schema'
import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'
import {
    generateConversationTitle,
    sendAssistantMessage,
} from '@/server/flue/actions'
import modelRegistry from '@/server/flue/model-registry'
import publisher from '@/server/orpc/publisher'

import base from '../base'

const idSchema = z.string().min(1)
const metadataSchema = z.record(z.string(), z.json())
const conversationSelectSchema = createSelectSchema(conversations, {
    metadata: metadataSchema,
})
const conversationStatusSchema = conversationSelectSchema.shape.status
const conversationUpdateSchema = createUpdateSchema(conversations, {
    metadata: metadataSchema.optional(),
    model: (schema) => schema.max(120),
    title: conversationTitleSchema.optional(),
})
const generateTitleResultSchema = z.object({
    title: conversationTitleSchema,
})

const isModelAvailable = async (model: string) => {
    const availableModels = await modelRegistry.getAvailable()

    return availableModels.some(
        (availableModel) =>
            `${availableModel.provider}/${availableModel.id}` === model
    )
}

interface GenerateAndUpdateConversationTitleOptions {
    conversationId: string
    userMessage: string
}

const generateAndUpdateConversationTitle = async ({
    conversationId,
    userMessage,
}: GenerateAndUpdateConversationTitleOptions) => {
    try {
        const result = generateTitleResultSchema.parse({
            title: await generateConversationTitle({
                conversationId,
                userMessage,
            }),
        })

        const [updatedConversation] = await database
            .update(conversations)
            .set({
                title: result.title,
            })
            .where(
                and(
                    eq(conversations.id, conversationId),
                    isNull(conversations.title)
                )
            )
            .returning()

        if (isNotNil(updatedConversation)) {
            await publisher.publish('conversation.title.generated', {
                conversationId: updatedConversation.id,
                type: 'conversation.title.generated',
            })
        }
    } catch (error) {
        console.error('Failed to generate conversation title', error)
    }
}

const conversationRouter = {
    create: base
        .input(
            chatSubmissionSchema.extend({
                projectId: idSchema.optional(),
            })
        )
        .handler(async ({ input, errors }) => {
            const conversationId = nanoid()

            const { model } = input

            if (!(await isModelAvailable(model))) {
                throw errors.BAD_REQUEST()
            }

            if (isNotNil(input.projectId)) {
                const projectRecord = await database.query.projects.findFirst({
                    where: {
                        id: input.projectId,
                    },
                })

                if (isNil(projectRecord)) {
                    throw errors.NOT_FOUND()
                }
            }

            const [createdConversation] = await database
                .insert(conversations)
                .values({
                    id: conversationId,
                    model,
                    projectId: input.projectId,
                })
                .onConflictDoNothing({ target: conversations.id })
                .returning()

            if (isNil(createdConversation)) {
                throw errors.CONFLICT()
            }

            await sendAssistantMessage({
                conversationId,
                message: input.message,
            })

            void generateAndUpdateConversationTitle({
                conversationId,
                userMessage: input.message,
            })

            return createdConversation
        }),
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
                    model: true,
                    title: true,
                })
                .extend({
                    id: idSchema,
                    model: modelSchema.optional(),
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
                    model: input.model,
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
