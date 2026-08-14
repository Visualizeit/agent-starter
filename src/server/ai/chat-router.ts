import { zValidator } from '@hono/zod-validator'
import {
    chatParamsFromRequestBody,
    resolveResumeRunId,
    resumeServerSentEventsResponse,
} from '@tanstack/ai'
import { reconstructChat } from '@tanstack/ai-persistence'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { validator } from 'hono/validator'
import { z } from 'zod'

import getChatContext from './chat-context'
import createChatDurability from './chat-durability'
import chatPersistence from './chat-persistence'
import createChatRunResponse from './chat-run-response'

const chatQuerySchema = z.xor([
    z.object({ runId: z.string().min(1) }),
    z.object({ threadId: z.string().min(1) }),
])

const validateChatRequest = validator(
    'json',
    async (body, context) =>
        await chatParamsFromRequestBody(body).catch(() =>
            context.text('Invalid chat request', 400)
        )
)

const chatRouter = new Hono()
    .post('/', validateChatRequest, async (context) => {
        const {
            messages,
            resume,
            runId,
            threadId: conversationId,
        } = context.req.valid('json')

        const chatContext = await getChatContext(conversationId)

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

        if (durability.resumeFrom() !== null) {
            const run = await chatPersistence.stores.runs.get(runId)

            if (!run || run.threadId !== conversationId) {
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
            threadId: conversationId,
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
