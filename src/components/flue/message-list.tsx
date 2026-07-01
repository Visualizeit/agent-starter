import type { FlueConversationMessage } from '@flue/react'
import { findLast } from 'es-toolkit/compat'
import { isNotNil } from 'es-toolkit/predicate'

import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@/components/ui/message-scroller'

import ConversationMessage from './conversation-message'

interface MessageListProps {
    messages: FlueConversationMessage[]
    streaming: boolean
}

const MessageList = ({ messages, streaming }: MessageListProps) => {
    const lastAssistantMessage = findLast(
        messages,
        (message) => message.role === 'assistant'
    )

    return (
        <MessageScrollerProvider defaultScrollPosition="end">
            <MessageScroller className="h-full">
                <MessageScrollerViewport>
                    <MessageScrollerContent className="p-(--mantine-spacing-lg) container mx-auto max-w-3xl">
                        {messages.map((message) => {
                            const messageStreaming =
                                streaming &&
                                isNotNil(lastAssistantMessage) &&
                                message.id === lastAssistantMessage.id

                            return (
                                <MessageScrollerItem
                                    key={message.id}
                                    messageId={message.id}
                                    scrollAnchor={message.role === 'user'}
                                >
                                    <ConversationMessage
                                        message={message}
                                        streaming={messageStreaming}
                                    />
                                </MessageScrollerItem>
                            )
                        })}
                    </MessageScrollerContent>
                </MessageScrollerViewport>
                <MessageScrollerButton />
            </MessageScroller>
        </MessageScrollerProvider>
    )
}

export default MessageList
