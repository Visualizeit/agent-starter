import { and, eq, inArray, isNull } from 'drizzle-orm'
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
import { attachments, conversations } from '@/server/db/schema'
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
    createDraft: base
        .input(
            z.object({
                model: modelSchema,
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
    send: base
        .input(
            chatSubmissionSchema.extend({
                attachmentIds: z.array(idSchema).max(1).default([]),
                id: idSchema,
                idempotencyKey: z.string().min(1).max(256),
            })
        )
        .handler(async ({ errors, input }) => {
            const conversation = await database.query.conversations.findFirst({
                where: {
                    id: input.id,
                    status: { ne: 'deleted' },
                },
            })

            if (isNil(conversation)) {
                throw errors.NOT_FOUND()
            }

            if (!(await isModelAvailable(input.model))) {
                throw errors.BAD_REQUEST()
            }

            const attachmentRecords =
                input.attachmentIds.length === 0
                    ? []
                    : await database.query.attachments.findMany({
                          where: {
                              conversationId: conversation.id,
                              id: { in: input.attachmentIds },
                          },
                      })

            if (attachmentRecords.length !== input.attachmentIds.length) {
                throw errors.NOT_FOUND()
            }

            if (
                attachmentRecords.some(
                    (attachment) =>
                        isNotNil(attachment.idempotencyKey) &&
                        attachment.idempotencyKey !== input.idempotencyKey
                )
            ) {
                throw errors.CONFLICT()
            }

            if (input.attachmentIds.length > 0) {
                await database
                    .update(attachments)
                    .set({ idempotencyKey: input.idempotencyKey })
                    .where(
                        and(
                            inArray(attachments.id, input.attachmentIds),
                            eq(attachments.conversationId, conversation.id),
                            isNull(attachments.idempotencyKey)
                        )
                    )

                const claimedAttachments =
                    await database.query.attachments.findMany({
                        where: {
                            conversationId: conversation.id,
                            id: { in: input.attachmentIds },
                            idempotencyKey: input.idempotencyKey,
                        },
                    })

                if (claimedAttachments.length !== input.attachmentIds.length) {
                    throw errors.CONFLICT()
                }
            }

            await database
                .update(conversations)
                .set({ model: input.model })
                .where(eq(conversations.id, conversation.id))

            const receipt = await sendAssistantMessage({
                conversationId: conversation.id,
                idempotencyKey: input.idempotencyKey,
                message: input.message,
            })

            if (input.attachmentIds.length > 0) {
                await database
                    .update(attachments)
                    .set({
                        status: 'attached',
                        submissionId: receipt.submissionId,
                    })
                    .where(
                        and(
                            inArray(attachments.id, input.attachmentIds),
                            eq(attachments.conversationId, conversation.id),
                            eq(attachments.idempotencyKey, input.idempotencyKey)
                        )
                    )
            }

            if (isNil(conversation.title)) {
                void generateAndUpdateConversationTitle({
                    conversationId: conversation.id,
                    userMessage: input.message,
                })
            }

            return { submissionId: receipt.submissionId }
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
