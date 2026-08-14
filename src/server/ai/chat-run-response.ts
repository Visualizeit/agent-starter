import {
    chat,
    defineChatMiddleware,
    toServerSentEventsResponse,
} from '@tanstack/ai'
import type { ModelMessage, RunAgentResumeItem, UIMessage } from '@tanstack/ai'
import { withPersistence } from '@tanstack/ai-persistence'

import createChatAdapter from './chat-adapter'
import type createChatDurability from './chat-durability'
import chatPersistence from './chat-persistence'

interface CreateChatRunResponseOptions {
    durability: ReturnType<typeof createChatDurability>
    messages: (ModelMessage | UIMessage)[]
    onStart?: () => void
    resume?: RunAgentResumeItem[]
    runId: string
    systemPrompts: string[]
    threadId: string
}

const createChatRunResponse = ({
    durability,
    messages,
    onStart,
    resume,
    runId,
    systemPrompts,
    threadId,
}: CreateChatRunResponseOptions) =>
    toServerSentEventsResponse(
        chat({
            adapter: createChatAdapter(),
            messages,
            middleware: [
                withPersistence(chatPersistence),
                ...(onStart
                    ? [
                          defineChatMiddleware({
                              name: 'chat-run-start-listener',
                              onStart,
                          }),
                      ]
                    : []),
            ],
            ...(resume ? { resume } : {}),
            runId,
            systemPrompts,
            threadId,
        }),
        {
            durability: { adapter: durability },
        }
    )
export default createChatRunResponse
