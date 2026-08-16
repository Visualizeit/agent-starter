import { zValidator } from '@hono/zod-validator'
import {
    chatParamsFromRequestBody,
    resolveResumeRunId,
    resumeServerSentEventsResponse,
} from '@tanstack/ai'
import { reconstructChat } from '@tanstack/ai-persistence'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validator } from 'hono/validator'
import { z } from 'zod'

import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'

import getChatContext from './chat-context'
import createChatDurability from './chat-durability'
import chatPersistence from './chat-persistence'
import createChatRunResponse from './chat-run-response'

const chatQuerySchema = z.xor([
    z.object({ runId: z.string().min(1) }),
    z.object({ threadId: z.string().min(1) }),
])
const newChatPropertiesSchema = z.object({
    projectId: z.string().min(1).optional(),
})

const parseChatParameters = async (body: unknown) => {
    try {
        return await chatParamsFromRequestBody(body)
    } catch (error) {
        throw new HTTPException(400, {
            cause: error,
            message: 'Invalid chat request',
        })
    }
}

const validateChatRequest = validator('json', parseChatParameters)

const chatRouter = new Hono()
    .post('/start', validateChatRequest, async (context) => {
        const { forwardedProps, messages, runId, threadId } =
            context.req.valid('json')

        const result = newChatPropertiesSchema.safeParse(forwardedProps)

        if (!result.success) {
            throw new HTTPException(400, {
                cause: result.error,
                message: 'Invalid new chat request',
            })
        }

        const { projectId } = result.data

        if (resolveResumeRunId(context.req.raw) !== runId) {
            throw new HTTPException(400, {
                message: 'Run ID does not match',
            })
        }

        const durability = createChatDurability(context.req.raw)

        if (isNotNil(durability.resumeFrom())) {
            return resumeServerSentEventsResponse({ adapter: durability })
        }

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
                throw new HTTPException(404, {
                    message: 'Project not found',
                })
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
                throw new HTTPException(409, {
                    message: 'Conversation cannot be retried',
                })
            }

            const activeRun =
                await chatPersistence.stores.runs.findActiveRun(threadId)

            if (isNotNil(activeRun)) {
                throw new HTTPException(409, {
                    message: 'Conversation already has an active run',
                })
            }
        }

        return createChatRunResponse({
            durability,
            messages,
            runId,
            systemPrompts: projectInstructions ? [projectInstructions] : [],
            threadId,
        })
    })
    .post('/', validateChatRequest, async (context) => {
        const { messages, resume, runId, threadId } = context.req.valid('json')

        const chatContext = await getChatContext(threadId)

        if (!chatContext) {
            throw new HTTPException(404, {
                message: 'Conversation not found',
            })
        }

        if (chatContext.status !== 'active') {
            throw new HTTPException(409, {
                message: 'Conversation is not active',
            })
        }

        if (resolveResumeRunId(context.req.raw) !== runId) {
            throw new HTTPException(400, {
                message: 'Run ID does not match',
            })
        }

        const durability = createChatDurability(context.req.raw)

        if (isNotNil(durability.resumeFrom())) {
            const run = await chatPersistence.stores.runs.get(runId)

            if (!run || run.threadId !== threadId) {
                throw new HTTPException(404, {
                    message: 'Chat run not found',
                })
            }

            return resumeServerSentEventsResponse({ adapter: durability })
        }

        return createChatRunResponse({
            durability,
            messages,
            ...(resume ? { resume } : {}),
            runId,
            systemPrompts: chatContext.projectInstructions
                ? [chatContext.projectInstructions]
                : [],
            threadId,
        })
    })
    .get('/', zValidator('query', chatQuerySchema), async (context) => {
        const query = context.req.valid('query')

        if ('runId' in query) {
            if (resolveResumeRunId(context.req.raw) !== query.runId) {
                throw new HTTPException(400, {
                    message: 'Run ID does not match',
                })
            }

            const run = await chatPersistence.stores.runs.get(query.runId)

            if (!run) {
                throw new HTTPException(404, {
                    message: 'Chat run not found',
                })
            }

            const chatContext = await getChatContext(run.threadId)

            if (!chatContext || chatContext.status === 'deleted') {
                throw new HTTPException(404, {
                    message: 'Conversation not found',
                })
            }

            return resumeServerSentEventsResponse({
                adapter: createChatDurability(context.req.raw),
            })
        }

        const chatContext = await getChatContext(query.threadId)

        if (!chatContext || chatContext.status === 'deleted') {
            throw new HTTPException(404, {
                message: 'Conversation not found',
            })
        }

        return await reconstructChat(chatPersistence, context.req.raw)
    })

export default chatRouter
