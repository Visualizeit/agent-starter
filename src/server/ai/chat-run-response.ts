import { chat, maxIterations } from '@tanstack/ai'
import type { WsRunContext } from '@tanstack/ai'
import { withPersistence } from '@tanstack/ai-persistence'

import chatAdapter from './chat-adapter'
import chatPersistence from './chat-persistence'
import createChatRunContextMiddleware from './chat-run-context-middleware'
import conversationTitleMiddleware from './conversation-title-middleware'

const createChatRunResponse = ({
    forwardedProps,
    messages,
    runId,
    signal,
    threadId,
}: WsRunContext) => {
    const abortController = new AbortController()

    if (signal.aborted) {
        abortController.abort(signal.reason)
    } else {
        signal.addEventListener(
            'abort',
            () => {
                abortController.abort(signal.reason)
            },
            { once: true }
        )
    }

    return chat({
        abortController,
        adapter: chatAdapter,
        agentLoopStrategy: maxIterations(100),
        messages,
        middleware: [
            createChatRunContextMiddleware({ forwardedProps, threadId }),
            withPersistence(chatPersistence, { snapshotStreaming: true }),
            conversationTitleMiddleware,
        ],
        runId,
        threadId,
    })
}
export default createChatRunResponse
