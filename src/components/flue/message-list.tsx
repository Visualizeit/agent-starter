import type { FlueConversationMessage } from '@flue/react'

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
}

const MessageList = ({ messages }: MessageListProps) => (
    <MessageScrollerProvider defaultScrollPosition="end">
        <MessageScroller className="h-full">
            <MessageScrollerViewport>
                <MessageScrollerContent className="p-(--mantine-spacing-lg) container mx-auto max-w-3xl">
                    {messages.map((message) => (
                        <MessageScrollerItem
                            key={message.id}
                            messageId={message.id}
                            scrollAnchor={message.role === 'user'}
                        >
                            <ConversationMessage message={message} />
                        </MessageScrollerItem>
                    ))}
                </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
        </MessageScroller>
    </MessageScrollerProvider>
)

export default MessageList
