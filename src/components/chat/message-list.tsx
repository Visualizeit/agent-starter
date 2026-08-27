import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Box } from '@mantine/core'
import type { UseChatReturn } from '@tanstack/ai-react'
import { last } from 'es-toolkit'

import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@/components/ui/message-scroller'

import ConversationMessage from './conversation-message'
import MessageTracking from './message-tracking'

const AssistantThinkingMarker = () => (
    <Marker render={<output />}>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
    </Marker>
)

interface AssistantErrorMarkerProps {
    message: string
}

const AssistantErrorMarker = ({ message }: AssistantErrorMarkerProps) => (
    <Marker render={<Box component="output" />}>
        <MarkerIcon>
            <HugeiconsIcon icon={AlertCircleIcon} />
        </MarkerIcon>
        <MarkerContent>{message}</MarkerContent>
    </Marker>
)

interface MessageListProps {
    error: UseChatReturn['error']
    isResponding: boolean
    messages: UseChatReturn['messages']
}

const MessageList = ({ error, isResponding, messages }: MessageListProps) => {
    const lastMessage = last(messages)
    const userMessages = messages.filter((message) => message.role === 'user')

    return (
        <MessageScrollerProvider autoScroll>
            <Box className="relative h-full">
                <MessageScroller className="h-full">
                    <MessageScrollerViewport>
                        <MessageScrollerContent
                            aria-busy={isResponding}
                            className="container mx-auto max-w-3xl p-(--mantine-spacing-lg)"
                        >
                            {messages.map((message) => (
                                <MessageScrollerItem
                                    key={message.id}
                                    className="flex flex-col gap-(--mantine-spacing-xs)"
                                    messageId={message.id}
                                    scrollAnchor={message.role === 'user'}
                                >
                                    <ConversationMessage
                                        isResponding={
                                            isResponding &&
                                            message === lastMessage &&
                                            message.role === 'assistant'
                                        }
                                        message={message}
                                    />
                                    {isResponding &&
                                        message === lastMessage &&
                                        message.role === 'user' && (
                                            <AssistantThinkingMarker />
                                        )}
                                </MessageScrollerItem>
                            ))}
                            {error && (
                                <AssistantErrorMarker message={error.message} />
                            )}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>
                <Box className="absolute top-1/2 left-2 -translate-y-1/2">
                    <MessageTracking messages={userMessages} />
                </Box>
            </Box>
        </MessageScrollerProvider>
    )
}

export default MessageList
