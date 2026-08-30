import { defineChatMiddleware } from '@tanstack/ai'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { z } from 'zod'

import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'

import getChatContext from './chat-context'
import chatPersistence from './chat-persistence'

interface CreateChatRunContextMiddlewareOptions {
    forwardedProps: unknown
    threadId: string
}

const newConversationPropertiesSchema = z.object({
    newConversation: z.literal(true),
    projectId: z.string().min(1).optional(),
})

const newConversationIndicatorSchema = newConversationPropertiesSchema.pick({
    newConversation: true,
})

const prepareNewChat = async (
    threadId: string,
    forwardedProperties: z.infer<typeof newConversationPropertiesSchema>
) => {
    const { projectId } = forwardedProperties

    let projectInstructions = ''

    if (isNotNil(projectId)) {
        const projectRecord = await database.query.projects.findFirst({
            columns: {
                instructions: true,
            },
            where: {
                id: projectId,
            },
        })

        if (isNil(projectRecord)) {
            throw new Error('Project not found')
        }

        projectInstructions = projectRecord.instructions
    }

    const [createdConversation] = await database
        .insert(conversations)
        .values({
            id: threadId,
            projectId,
        })
        .onConflictDoNothing({ target: conversations.id })
        .returning({ id: conversations.id })

    if (isNil(createdConversation)) {
        const existingConversation =
            await database.query.conversations.findFirst({
                columns: {
                    projectId: true,
                    status: true,
                },
                where: {
                    id: threadId,
                },
            })

        if (
            isNil(existingConversation) ||
            existingConversation.projectId !== (projectId ?? null) ||
            existingConversation.status !== 'active'
        ) {
            throw new Error('Conversation cannot be retried')
        }

        const activeRun =
            await chatPersistence.stores.runs.findActiveRun(threadId)

        if (isNotNil(activeRun)) {
            throw new Error('Conversation already has an active run')
        }
    }

    return projectInstructions ? [projectInstructions] : []
}

const prepareExistingChat = async (threadId: string) => {
    const chatContext = await getChatContext(threadId)

    if (isNil(chatContext)) {
        throw new Error('Conversation not found')
    }

    if (chatContext.status !== 'active') {
        throw new Error('Conversation is not active')
    }

    return chatContext.projectInstructions
        ? [chatContext.projectInstructions]
        : []
}

const createChatRunContextMiddleware = ({
    forwardedProps,
    threadId,
}: CreateChatRunContextMiddlewareOptions) => {
    const newConversationProperties = z.validate(
        newConversationIndicatorSchema,
        forwardedProps
    )
        ? newConversationPropertiesSchema.parse(forwardedProps)
        : undefined

    let systemPromptsPromise: Promise<string[]> | undefined

    const prepareChat = async () => {
        systemPromptsPromise ??= isNotNil(newConversationProperties)
            ? prepareNewChat(threadId, newConversationProperties)
            : prepareExistingChat(threadId)

        return await systemPromptsPromise
    }

    return defineChatMiddleware({
        name: 'chat-run-context',
        onConfig: async () => ({
            systemPrompts: await prepareChat(),
        }),
    })
}

export default createChatRunContextMiddleware
