import type { ModelMessage } from '@tanstack/ai'
import { and, eq, isNull } from 'drizzle-orm'
import { createSelectSchema, createUpdateSchema } from 'drizzle-orm/zod'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { invariant } from 'es-toolkit/util'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import { chatSubmissionSchema } from '@/schemas/chat-submission-schema'
import { conversationTitleSchema } from '@/schemas/rename-conversation-schema'
import createChatDurability from '@/server/ai/chat-durability'
import chatPersistence from '@/server/ai/chat-persistence'
import createChatRunResponse from '@/server/ai/chat-run-response'
import generateConversationTitle from '@/server/ai/generate-title'
import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'
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
    title: conversationTitleSchema.optional(),
})
const generateTitleResultSchema = z.object({
    title: conversationTitleSchema,
})

interface GenerateAndUpdateConversationTitleOptions {
    conversationId: string
    userMessage: string
}

interface RunStartSignal {
    promise: Promise<null>
    resolve: () => null
}

// oxlint-disable-next-line unicorn/consistent-function-scoping -- Default resolver is replaced synchronously by the Promise executor.
const unresolvedRunStart = () => null

const createRunStartSignal = (): RunStartSignal => {
    let resolveRunStart = unresolvedRunStart
    // oxlint-disable-next-line promise/avoid-new -- Bridge TanStack's middleware callback to the ORPC request.
    const promise = new Promise<null>((resolve) => {
        resolveRunStart = () => {
            resolve(null)
            return null
        }
    })

    return { promise, resolve: resolveRunStart }
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
            .set({ title: result.title })
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
            const runId = nanoid()
            const messages: ModelMessage[] = [
                { content: input.message, id: nanoid(), role: 'user' },
            ]
            let projectInstructions = ''

            if (isNotNil(input.projectId)) {
                const projectRecord = await database.query.projects.findFirst({
                    where: {
                        id: input.projectId,
                    },
                })

                if (isNil(projectRecord)) {
                    throw errors.NOT_FOUND()
                }

                projectInstructions = projectRecord.instructions
            }

            const [createdConversation] = await database
                .insert(conversations)
                .values({
                    id: conversationId,
                    projectId: input.projectId,
                })
                .onConflictDoNothing({ target: conversations.id })
                .returning()

            if (isNil(createdConversation)) {
                throw errors.CONFLICT()
            }

            try {
                await chatPersistence.stores.messages.saveThread(
                    conversationId,
                    messages
                )

                const runStart = createRunStartSignal()
                let runStarted = false
                const response = createChatRunResponse({
                    durability: createChatDurability(
                        new Request('http://localhost/api/chat', {
                            headers: { 'X-Run-Id': runId },
                            method: 'POST',
                        })
                    ),
                    messages: [],
                    onStart: () => {
                        runStarted = true
                        runStart.resolve()
                    },
                    runId,
                    systemPrompts: projectInstructions
                        ? [projectInstructions]
                        : [],
                    threadId: conversationId,
                })

                invariant(response.body, 'Chat response body is missing')
                const runCompletion = response.body.pipeTo(new WritableStream())

                await Promise.race([
                    runStart.promise,
                    runCompletion.then(() => {
                        invariant(runStarted, 'Chat run was not started')
                    }),
                ])
            } catch (error) {
                await database
                    .delete(conversations)
                    .where(eq(conversations.id, conversationId))

                throw error
            }

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
