import { Box, Group } from '@mantine/core'
import type { UIMessage } from '@tanstack/ai-react'

import AssistantMessageBody from '@/components/ui/assistant-message-body'
import { Message, MessageContent } from '@/components/ui/message'
import UserMessageBody from '@/components/ui/user-message-body'

import AssistantMessageProcess from './assistant-message-process'
import MessageCopyButton from './message-copy-button'
import MessageResponse from './message-response'

interface ConversationMessageProps {
    isResponding: boolean
    message: UIMessage
}

type MessagePart = UIMessage['parts'][number]
type TextMessagePart = Extract<MessagePart, { type: 'text' }>
type ThinkingMessagePart = Extract<MessagePart, { type: 'thinking' }>

const isTextPart = (part: MessagePart): part is TextMessagePart =>
    part.type === 'text'

const isThinkingPart = (part: MessagePart): part is ThinkingMessagePart =>
    part.type === 'thinking'

const getText = (parts: readonly TextMessagePart[]) =>
    parts.map((part) => part.content).join('\n\n')

const UserMessage = ({
    message,
}: Pick<ConversationMessageProps, 'message'>) => {
    const textParts = message.parts.filter(isTextPart)
    const copyText = getText(textParts)

    return (
        <Message align="end">
            <MessageContent>
                {textParts.map((part, index) => (
                    <UserMessageBody key={`${message.id}:text:${index}`}>
                        <MessageResponse markdown={part.content} />
                    </UserMessageBody>
                ))}
                {copyText.length > 0 && (
                    <Group
                        className="pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-has-focus-visible/message:pointer-events-auto group-has-focus-visible/message:opacity-100"
                        justify="flex-end"
                    >
                        <MessageCopyButton value={copyText} />
                    </Group>
                )}
            </MessageContent>
        </Message>
    )
}

const AssistantMessage = ({
    isResponding,
    message,
}: ConversationMessageProps) => {
    const thinkingParts = message.parts.filter(isThinkingPart)
    const textParts = message.parts.filter(isTextPart)
    const copyText = getText(textParts)

    return (
        <Message>
            <MessageContent>
                {thinkingParts.length > 0 && (
                    <AssistantMessageProcess isResponding={isResponding}>
                        {thinkingParts.map((part, index) => (
                            <Box
                                className="text-muted-foreground text-sm"
                                key={`${message.id}:thinking:${index}`}
                            >
                                <MessageResponse
                                    isStreaming={isResponding}
                                    markdown={part.content}
                                />
                            </Box>
                        ))}
                    </AssistantMessageProcess>
                )}
                {textParts.map((part, index) => (
                    <AssistantMessageBody key={`${message.id}:text:${index}`}>
                        <MessageResponse
                            isStreaming={isResponding}
                            markdown={part.content}
                        />
                    </AssistantMessageBody>
                ))}
                {!isResponding && copyText.length > 0 && (
                    <Group
                        className="pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-has-focus-visible/message:pointer-events-auto group-has-focus-visible/message:opacity-100"
                        justify="flex-start"
                    >
                        <MessageCopyButton value={copyText} />
                    </Group>
                )}
            </MessageContent>
        </Message>
    )
}

const ConversationMessage = (props: ConversationMessageProps) =>
    props.message.role === 'user' ? (
        <UserMessage message={props.message} />
    ) : (
        <AssistantMessage {...props} />
    )

export default ConversationMessage
