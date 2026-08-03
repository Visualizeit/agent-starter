import type { FlueConversationMessage } from '@flue/react'
import { Group } from '@mantine/core'
import { flatMap } from 'es-toolkit'
import { match } from 'ts-pattern'

import Reasoning from '@/components/ai-elements/reasoning'
import MessageCopyButton from '@/components/flue/message-copy-button'
import MessageResponse from '@/components/flue/message-response'
import AssistantMessageBody from '@/components/ui/assistant-message-body'
import { Message, MessageContent } from '@/components/ui/message'
import UserMessageBody from '@/components/ui/user-message-body'

interface ConversationMessageProps {
    message: FlueConversationMessage
}

const getMessageCopyText = (message: FlueConversationMessage) =>
    flatMap(message.parts, (part) =>
        match(part)
            .with({ type: 'text' }, (textPart) => [textPart.text])
            .otherwise(() => [])
    ).join('\n\n')

const ConversationMessage = ({ message }: ConversationMessageProps) => {
    const align = message.role === 'user' ? 'end' : 'start'

    const copyText = getMessageCopyText(message)

    return (
        <Message align={align}>
            <MessageContent>
                {message.parts.map((part, index) =>
                    match(part)
                        .with({ type: 'reasoning' }, (reasoningPart) => (
                            <AssistantMessageBody key={index}>
                                <Reasoning
                                    isStreaming={
                                        reasoningPart.state === 'streaming'
                                    }
                                >
                                    {reasoningPart.text}
                                </Reasoning>
                            </AssistantMessageBody>
                        ))
                        .with({ type: 'text' }, (textPart) =>
                            message.role === 'user' ? (
                                <UserMessageBody key={index}>
                                    <MessageResponse
                                        isStreaming={
                                            textPart.state === 'streaming'
                                        }
                                        markdown={textPart.text}
                                    />
                                </UserMessageBody>
                            ) : (
                                <AssistantMessageBody key={index}>
                                    <MessageResponse
                                        isStreaming={
                                            textPart.state === 'streaming'
                                        }
                                        markdown={textPart.text}
                                    />
                                </AssistantMessageBody>
                            )
                        )
                        .otherwise(() => null)
                )}
                {copyText.length > 0 && (
                    <Group
                        className="invisible group-hover/message:visible group-focus-within/message:visible"
                        justify={align === 'end' ? 'flex-end' : 'flex-start'}
                    >
                        <MessageCopyButton value={copyText} />
                    </Group>
                )}
            </MessageContent>
        </Message>
    )
}

export default ConversationMessage
