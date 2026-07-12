import type { FlueConversationMessage } from '@flue/react'
import { Box } from '@mantine/core'

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

interface MessageListProps {
    messages: FlueConversationMessage[]
}

const MessageList = ({ messages }: MessageListProps) => (
    <MessageScrollerProvider defaultScrollPosition="end">
        <Box className="relative h-full">
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
            <Box className="absolute top-1/2 left-2 -translate-y-1/2">
                <MessageTracking messages={messages} />
            </Box>
        </Box>
    </MessageScrollerProvider>
)

export default MessageList
