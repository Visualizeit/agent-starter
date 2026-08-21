import { defineChatMiddleware } from '@tanstack/ai'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { z } from 'zod'

import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'

import getChatContext from './chat-context'
import chatPersistence from './chat-persistence'

interface CreateChatRunContextMiddlewareOptions {
    forwardedProps?: Record<string, unknown>
    threadId: string
}

const newChatPropertiesSchema = z.object({
    projectId: z.string().min(1).optional(),
    start: z.literal(true),
})

const prepareNewChat = async (
    threadId: string,
    forwardedProps: Record<string, unknown>
) => {
    const { projectId } = newChatPropertiesSchema.parse(forwardedProps)

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
    let systemPromptsPromise: Promise<string[]> | undefined

    const prepareChat = () => {
        if (isNotNil(systemPromptsPromise)) {
            return systemPromptsPromise
        }

        systemPromptsPromise =
            isNotNil(forwardedProps) && forwardedProps.start === true
                ? prepareNewChat(threadId, forwardedProps)
                : prepareExistingChat(threadId)

        return systemPromptsPromise
    }

    return defineChatMiddleware({
        name: 'chat-run-context',
        onConfig: async () => ({
            systemPrompts: await prepareChat(),
        }),
    })
}

export default createChatRunContextMiddleware
