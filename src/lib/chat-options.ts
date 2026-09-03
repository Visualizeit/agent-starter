import type { UseChatOptions } from '@tanstack/ai-react'

import byok from '@/lib/byok'
import chatConnection from '@/lib/chat-connection'
import useModelStore from '@/stores/model-store'

const getByokProvider = () => {
    const selectedModel = useModelStore.getState().getSelectedModel()

    return selectedModel === null ? undefined : selectedModel.credentialId
}

const chatOptions = {
    byok,
    byokProvider: getByokProvider,
    connection: chatConnection,
    persistence: true,
} satisfies Omit<Extract<UseChatOptions, { persistence: true }>, 'threadId'>

export default chatOptions
