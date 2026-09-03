import type { UIMessage } from '@tanstack/ai-react'
import { invariant } from 'es-toolkit/util'
import { createContext, useContext } from 'react'

interface MessageRenderContextValue {
    isResponding: boolean
    role: UIMessage['role']
}

const MessageRenderContext = createContext<MessageRenderContextValue | null>(
    null
)

const useMessageRenderContext = () => {
    const value = useContext(MessageRenderContext)

    invariant(value, 'Message render context is not set')

    return value
}

const messageRenderContext = {
    Provider: MessageRenderContext.Provider,
    useMessageRenderContext,
}

export default messageRenderContext
