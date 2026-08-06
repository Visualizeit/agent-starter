import type { AgentStatus, FlueConversationMessage } from '@flue/react'
import { Box } from '@mantine/core'
import { last } from 'es-toolkit'
import { invariant } from 'es-toolkit/util'

import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@/components/ui/message-scroller'

import ConversationMessage from './conversation-message'
import type { ConversationMessageGroup } from './conversation-message'
import MessageTracking from './message-tracking'

interface MessageListProps {
    messages: FlueConversationMessage[]
    status: AgentStatus
}

const groupMessages = (
    messages: FlueConversationMessage[]
): ConversationMessageGroup[] => {
    const groups: ConversationMessageGroup[] = []

    for (const message of messages) {
        if (
            message.display !== 'visible' ||
            (message.role !== 'assistant' && message.role !== 'user')
        ) {
            continue
        }

        if (message.role === 'user') {
            groups.push({
                id: message.id,
                messages: [message],
                role: message.role,
                submissionId: message.submissionId,
            })

            continue
        }

        invariant(
            message.submissionId,
            'Visible assistant message has no submission id'
        )

        const previousGroup = last(groups)

        if (
            previousGroup &&
            previousGroup.role === message.role &&
            previousGroup.submissionId === message.submissionId
        ) {
            previousGroup.messages.push(message)

            continue
        }

        groups.push({
            id: message.id,
            messages: [message],
            role: message.role,
            submissionId: message.submissionId,
        })
    }

    return groups
}

const MessageList = ({ messages, status }: MessageListProps) => {
    const groups = groupMessages(messages)

    const isResponding = status === 'submitted' || status === 'streaming'

    const lastGroup = last(groups)

    const activeAssistantGroup =
        isResponding && lastGroup && lastGroup.role === 'assistant'
            ? lastGroup
            : undefined

    return (
        <MessageScrollerProvider autoScroll defaultScrollPosition="last-anchor">
            <Box className="relative h-full">
                <MessageScroller className="h-full">
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="p-(--mantine-spacing-lg) container mx-auto max-w-3xl">
                            {groups.map((group) => (
                                <MessageScrollerItem
                                    key={group.id}
                                    messageId={group.id}
                                    scrollAnchor={group.role === 'user'}
                                >
                                    <ConversationMessage
                                        group={group}
                                        isResponding={
                                            group === activeAssistantGroup
                                        }
                                    />
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
}

export default MessageList
