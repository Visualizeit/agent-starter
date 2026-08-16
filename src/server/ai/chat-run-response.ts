import { chat, maxIterations, toServerSentEventsResponse } from '@tanstack/ai'
import type { ModelMessage, RunAgentResumeItem, UIMessage } from '@tanstack/ai'
import { withPersistence } from '@tanstack/ai-persistence'

import createChatAdapter from './chat-adapter'
import type createChatDurability from './chat-durability'
import chatPersistence from './chat-persistence'
import conversationTitleMiddleware from './conversation-title-middleware'

interface CreateChatRunResponseOptions {
    durability: ReturnType<typeof createChatDurability>
    messages: (ModelMessage | UIMessage)[]
    resume?: RunAgentResumeItem[]
    runId: string
    systemPrompts: string[]
    threadId: string
}

const createChatRunResponse = ({
    durability,
    messages,
    resume,
    runId,
    systemPrompts,
    threadId,
}: CreateChatRunResponseOptions) =>
    toServerSentEventsResponse(
        chat({
            adapter: createChatAdapter(),
            agentLoopStrategy: maxIterations(100),
            messages,
            middleware: [
                withPersistence(chatPersistence),
                conversationTitleMiddleware,
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
