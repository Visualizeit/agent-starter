import { dispatch, init } from '@flue/runtime'

import assistant from './agents/assistant'
import generateTitle from './agents/generate-title'
import { getFlueRuntime } from './runtime'

interface SendAssistantMessageOptions {
    conversationId: string
    message: string
    projectPath: string | null
}

export const sendAssistantMessage = async ({
    conversationId,
    message,
    projectPath,
}: SendAssistantMessageOptions) => {
    await getFlueRuntime()

    return dispatch(assistant, {
        id: conversationId,
        initialData: { projectPath },
        message,
    })
}

interface GenerateConversationTitleOptions {
    conversationId: string
    userMessage: string
}

export const generateConversationTitle = async ({
    conversationId,
    userMessage,
}: GenerateConversationTitleOptions) => {
    await getFlueRuntime()

    const titleAgent = init(generateTitle, { id: conversationId })
    const receipt = await titleAgent.dispatch(
        `Generate a concise title for the following content:\n\n${userMessage}`
    )
    const reply = await titleAgent.read(receipt)

    return reply.text
}
