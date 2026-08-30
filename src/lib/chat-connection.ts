import { webSocket } from '@tanstack/ai-react'
import type { SubscribeConnectionAdapter } from '@tanstack/ai-react'
import { invariant } from 'es-toolkit/util'

type ChatHydrationResult = Awaited<
    ReturnType<NonNullable<SubscribeConnectionAdapter['hydrate']>>
>

const hydrateChat: NonNullable<SubscribeConnectionAdapter['hydrate']> = async (
    threadId
) => {
    const response = await fetch(
        `/api/chat?threadId=${encodeURIComponent(threadId)}`
    )

    invariant(response.ok, `Failed to hydrate chat: ${response.status}`)

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- SAFETY: TanStack reconstructChat owns this response contract.
    return (await response.json()) as ChatHydrationResult
}

export const newChatConnection = webSocket('/api/chat-ws', {
    body: { start: true },
})

const chatConnection = {
    ...webSocket('/api/chat-ws'),
    hydrate: hydrateChat,
}

export default chatConnection
