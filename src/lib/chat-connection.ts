import { webSocket } from '@tanstack/ai-react'
import type { SubscribeConnectionAdapter } from '@tanstack/ai-react'
import { invariant } from 'es-toolkit/util'

const hydrateChat: NonNullable<SubscribeConnectionAdapter['hydrate']> = async (
    threadId
) => {
    const response = await fetch(
        `/api/chat?threadId=${encodeURIComponent(threadId)}`
    )

    invariant(response.ok, `Failed to hydrate chat: ${response.status}`)

    return await response.json()
}

export const newChatConnection = webSocket('/api/chat-ws', {
    body: { start: true },
})

const chatConnection = {
    ...webSocket('/api/chat-ws'),
    hydrate: hydrateChat,
}

export default chatConnection
