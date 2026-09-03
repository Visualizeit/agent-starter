import { Group } from '@mantine/core'
import type { MessageProps } from '@tanstack/ai-react/ui'
import { last } from 'es-toolkit'
import { useMemo } from 'react'

import { Marker, MarkerContent } from '@/components/ui/marker'
import { Message, MessageContent } from '@/components/ui/message'
import { MessageScrollerItem } from '@/components/ui/message-scroller'
import type chatOptions from '@/lib/chat-options'
import chatUiContext from '@/lib/chat-ui-context'

import MessageCopyButton from './message-copy-button'
import MessageRenderContext from './message-render-context'

type MessagePart = MessageProps<typeof chatOptions>['message']['parts'][number]
type TextMessagePart = Extract<MessagePart, { type: 'text' }>

const isTextPart = (part: MessagePart): part is TextMessagePart =>
    part.type === 'text'

const getText = (parts: readonly TextMessagePart[]) =>
    parts.map((part) => part.content).join('\n\n')

const AssistantThinkingMarker = () => (
    <Marker render={<output />}>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
    </Marker>
)

const ConversationMessage = ({
    message,
    Parts,
}: MessageProps<typeof chatOptions>) => {
    const { isLoading, messages, sessionGenerating } =
        chatUiContext.useChatContext()
    const isResponding = isLoading || sessionGenerating
    const isLastMessage = message === last(messages)
    const isUserMessage = message.role === 'user'
    const isMessageResponding = isResponding && isLastMessage && !isUserMessage
    const textParts = message.parts.filter(isTextPart)
    const copyText = getText(textParts)
    const messageRenderContextValue = useMemo(
        () => ({
            isResponding: isMessageResponding,
            role: message.role,
        }),
        [isMessageResponding, message.role]
    )

    return (
        <MessageScrollerItem
            className="flex flex-col gap-(--mantine-spacing-xs)"
            messageId={message.id}
            scrollAnchor={isUserMessage}
        >
            <Message align={isUserMessage ? 'end' : undefined}>
                <MessageContent>
                    <MessageRenderContext.Provider
                        value={messageRenderContextValue}
                    >
                        <Parts />
                    </MessageRenderContext.Provider>
                    {(!isMessageResponding || isUserMessage) &&
                        copyText.length > 0 && (
                            <Group
                                className="pointer-events-none opacity-0 group-hover/message:pointer-events-auto group-hover/message:opacity-100 group-has-focus-visible/message:pointer-events-auto group-has-focus-visible/message:opacity-100"
                                justify={
                                    isUserMessage ? 'flex-end' : 'flex-start'
                                }
                            >
                                <MessageCopyButton value={copyText} />
                            </Group>
                        )}
                </MessageContent>
            </Message>
            {isResponding && isLastMessage && isUserMessage && (
                <AssistantThinkingMarker />
            )}
        </MessageScrollerItem>
    )
}

export default ConversationMessage
