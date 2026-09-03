import type { PartProps } from '@tanstack/ai-react/ui'

import AssistantMessageBody from '@/components/ui/assistant-message-body'
import UserMessageBody from '@/components/ui/user-message-body'
import type chatOptions from '@/lib/chat-options'

import MessageRenderContext from './message-render-context'
import MessageResponse from './message-response'

const TextMessagePart = ({ part }: PartProps<typeof chatOptions, 'text'>) => {
    const { isResponding, role } =
        MessageRenderContext.useMessageRenderContext()
    const response = (
        <MessageResponse
            isStreaming={isResponding && role !== 'user'}
            markdown={part.content}
        />
    )

    return role === 'user' ? (
        <UserMessageBody>{response}</UserMessageBody>
    ) : (
        <AssistantMessageBody>{response}</AssistantMessageBody>
    )
}

export default TextMessagePart
