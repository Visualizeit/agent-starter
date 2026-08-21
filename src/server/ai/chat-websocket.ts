import { resumeWebSocketStream, toWebSocketStream } from '@tanstack/ai'
import type { WebSocketLike } from '@tanstack/ai'
import { isNil } from 'es-toolkit/predicate'

import getChatContext from './chat-context'
import createChatDurability from './chat-durability'
import chatPersistence from './chat-persistence'
import createChatRunResponse from './chat-run-response'

interface ConnectChatWebSocketOptions {
    request: Request
    socket: WebSocketLike
}

const resumeChatWebSocket = async (socket: WebSocketLike, request: Request) => {
    const runId = new URL(request.url).searchParams.get('runId')

    if (isNil(runId)) {
        socket.close(1008, 'run id required')
        return
    }

    const run = await chatPersistence.stores.runs.get(runId)

    if (isNil(run)) {
        socket.close(1008, 'chat run not found')
        return
    }

    const chatContext = await getChatContext(run.threadId)

    if (isNil(chatContext) || chatContext.status === 'deleted') {
        socket.close(1008, 'conversation not found')
        return
    }

    resumeWebSocketStream(socket, {
        adapter: createChatDurability(request),
    })
}

const connectChatWebSocket = async ({
    request,
    socket,
}: ConnectChatWebSocketOptions) => {
    const offset = new URL(request.url).searchParams.get('offset')

    if (isNil(offset)) {
        toWebSocketStream(socket, request, {
            durability: ({ request: runRequest }) =>
                createChatDurability(runRequest),
            onRun: createChatRunResponse,
        })
        return
    }

    await resumeChatWebSocket(socket, request)
}

export default connectChatWebSocket
