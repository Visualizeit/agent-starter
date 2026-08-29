import type { WebSocketLike } from '@tanstack/ai'
import { defineWebSocketHandler } from 'nitro'

import connectChatWebSocket from '@/server/ai/chat-websocket'

const chatWebSocketHandler = defineWebSocketHandler({
    open: async (peer) => {
        await connectChatWebSocket({
            request: peer.request,
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Nitro exposes a compatible runtime WebSocket with partial typings.
            socket: peer.websocket as WebSocketLike,
        })
    },
})

export default chatWebSocketHandler
