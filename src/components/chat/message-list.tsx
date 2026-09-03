import { AlertCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Box } from '@mantine/core'
import type { PropsWithChildren } from 'react'

import { Marker, MarkerContent, MarkerIcon } from '@/components/ui/marker'
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import chatUiContext from '@/lib/chat-ui-context'

import MessageTracking from './message-tracking'

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

const MessageList = ({ children }: PropsWithChildren) => {
    const { error, isLoading, messages, sessionGenerating } =
        chatUiContext.useChatContext()
    const isResponding = isLoading || sessionGenerating
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
                            {children}
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
