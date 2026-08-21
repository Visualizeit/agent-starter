import { zValidator } from '@hono/zod-validator'
import { reconstructChat } from '@tanstack/ai-persistence'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'

import getChatContext from './chat-context'
import chatPersistence from './chat-persistence'

const chatQuerySchema = z.object({ threadId: z.string().min(1) })

const chatRouter = new Hono().get(
    '/',
    zValidator('query', chatQuerySchema),
    async (context) => {
        const { threadId } = context.req.valid('query')

        const chatContext = await getChatContext(threadId)

        if (!chatContext || chatContext.status === 'deleted') {
            throw new HTTPException(404, {
                message: 'Conversation not found',
            })
        }

        return await reconstructChat(chatPersistence, context.req.raw)
    }
)

export default chatRouter
