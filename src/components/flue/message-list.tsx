import type { UseFlueAgentResult } from '@flue/react'
import { AlertCircleIcon, StopIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Box } from '@mantine/core'
import { cn } from 'cnfast'
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
import STATUS_COLORS from '@/configs/status-colors'

import ConversationMessage from './conversation-message'
import getMessageListItems from './message-list-items'
import type { MessageMarkerItem } from './message-list-items'
import MessageTracking from './message-tracking'

type MessageListProps = Pick<
    UseFlueAgentResult,
    'failedSends' | 'messages' | 'status'
>

const ConversationMarker = ({ marker }: Pick<MessageMarkerItem, 'marker'>) => {
    const isSettlement = 'outcome' in marker
    const isAborted = isSettlement && marker.outcome === 'aborted'

    let text = 'Response was stopped.'

    if (!isSettlement) {
        text = 'Message not sent.'
    } else if (marker.outcome === 'failed') {
        text = "The assistant couldn't finish this response."
    }

    return (
        <Marker
            className={cn(!isSettlement && 'ml-auto w-fit')}
            render={
                <Box
                    c={isSettlement ? undefined : STATUS_COLORS.DANGER}
                    component="output"
                />
            }
        >
            <MarkerIcon>
                <HugeiconsIcon icon={isAborted ? StopIcon : AlertCircleIcon} />
            </MarkerIcon>
            <MarkerContent>{text}</MarkerContent>
        </Marker>
    )
}

const PendingResponseMarker = () => (
    <Marker render={<output />}>
        <MarkerContent className="shimmer">Thinking...</MarkerContent>
    </Marker>
)

const MessageList = ({ failedSends, messages, status }: MessageListProps) => {
    const items = getMessageListItems(messages, last(failedSends))

    const isResponding = status === 'submitted' || status === 'streaming'

    const lastItem = last(items)

    const activeAssistantGroup =
        isResponding &&
        lastItem &&
        lastItem.kind === 'message' &&
        lastItem.role === 'assistant'
            ? lastItem
            : undefined

    return (
        <MessageScrollerProvider autoScroll>
            <Box className="relative h-full">
                <MessageScroller className="h-full">
                    <MessageScrollerViewport>
                        <MessageScrollerContent
                            aria-busy={isResponding}
                            className="p-(--mantine-spacing-lg) container mx-auto max-w-3xl"
                        >
                            {items.map((item) => {
                                if (item.kind === 'message') {
                                    return (
                                        <MessageScrollerItem
                                            key={item.id}
                                            className="flex flex-col gap-(--mantine-spacing-xs)"
                                            messageId={item.id}
                                            scrollAnchor={item.role === 'user'}
                                        >
                                            <ConversationMessage
                                                group={item}
                                                isResponding={
                                                    item ===
                                                    activeAssistantGroup
                                                }
                                            />
                                            {isResponding &&
                                                item === lastItem &&
                                                item.role === 'user' && (
                                                    <PendingResponseMarker />
                                                )}
                                        </MessageScrollerItem>
                                    )
                                }

                                return (
                                    <ConversationMarker
                                        key={item.id}
                                        marker={item.marker}
                                    />
                                )
                            })}
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
}

export default MessageList
