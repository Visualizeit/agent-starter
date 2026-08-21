import type { WebSocketLike } from '@tanstack/ai'
import { defineWebSocketHandler } from 'nitro'

import connectChatWebSocket from '@/server/ai/chat-websocket'

const chatWebSocketHandler = defineWebSocketHandler({
    open: async (peer) => {
        await connectChatWebSocket({
            request: peer.request,
            socket: peer.websocket as WebSocketLike,
        })
    },
})

export default chatWebSocketHandler
