import {
    chat,
    chatParamsFromRequest,
    defineChatMiddleware,
    maxIterations,
    memoryStream,
    resumeServerSentEventsResponse,
    toServerSentEventsResponse,
} from '@tanstack/ai'
import { reconstructChat, withPersistence } from '@tanstack/ai-persistence'
import { Elysia, status } from 'elysia'
import { isNil } from 'es-toolkit/predicate'
import { z } from 'zod'

import createChatAdapter from './chat-adapter'
import getChatContext from './chat-context'
import chatPersistence from './chat-persistence'
import createChatRunContextMiddleware from './chat-run-context-middleware'
import chatRunRegistry from './chat-run-registry'
import createConversationTitleMiddleware from './conversation-title-middleware'

const idSchema = z.string().min(1)

const chatQuerySchema = z.union([
    z.object({ offset: z.string(), runId: idSchema }),
    z.object({ threadId: idSchema }),
])

const chatRouter = new Elysia({ name: 'chat-router', prefix: '/api/chat' })
    .get(
        '/',
        async ({ query, request }) => {
            if ('offset' in query) {
                const run = await chatPersistence.stores.runs.get(query.runId)

                if (isNil(run)) {
                    return status(404, 'Chat run not found')
                }

                const chatContext = await getChatContext(run.threadId)

                if (isNil(chatContext) || chatContext.status === 'deleted') {
                    return status(404, 'Conversation not found')
                }

                return resumeServerSentEventsResponse({
                    adapter: memoryStream(request),
                })
            }

            const chatContext = await getChatContext(query.threadId)

            if (isNil(chatContext) || chatContext.status === 'deleted') {
                return status(404, 'Conversation not found')
            }

            return await reconstructChat(chatPersistence, request)
        },
        { query: chatQuerySchema }
    )
    .post(
        '/',
        async ({ request }) => {
            const streamAdapter = memoryStream(request)

            if (streamAdapter.resumeFrom() !== null) {
                return resumeServerSentEventsResponse({
                    adapter: streamAdapter,
                })
            }

            try {
                const { forwardedProps, messages, runId, threadId } =
                    await chatParamsFromRequest(request)
                const chatAdapter = createChatAdapter(request, forwardedProps)

                const chatRunContextMiddleware = createChatRunContextMiddleware(
                    {
                        forwardedProps,
                        threadId,
                    }
                )

                const abortController =
                    chatRunRegistry.createAbortController(runId)

                const releaseChatRun = () => {
                    chatRunRegistry.release(runId, abortController)
                }

                const chatRunRegistryMiddleware = defineChatMiddleware({
                    name: 'chat-run-registry',
                    onAbort: releaseChatRun,
                    onError: releaseChatRun,
                    onFinish: releaseChatRun,
                })

                const stream = chat({
                    abortController,
                    adapter: chatAdapter,
                    agentLoopStrategy: maxIterations(100),
                    messages,
                    middleware: [
                        chatRunContextMiddleware,
                        withPersistence(chatPersistence, {
                            snapshotStreaming: true,
                        }),
                        createConversationTitleMiddleware(chatAdapter),
                        chatRunRegistryMiddleware,
                    ],
                    runId,
                    threadId,
                })

                return toServerSentEventsResponse(stream, {
                    abortController,
                    durability: { adapter: streamAdapter },
                })
            } catch (error) {
                if (error instanceof Response) {
                    return error
                }

                throw error
            }
        },
        { parse: 'none' }
    )

export default chatRouter
