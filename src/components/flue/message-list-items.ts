import type { FailedSend, FlueConversationMessage } from '@flue/react'
import { last } from 'es-toolkit'
import get from 'es-toolkit/compat/get'
import { isNotNil } from 'es-toolkit/predicate'

export interface ConversationMessageGroup {
    id: FlueConversationMessage['id']
    messages: FlueConversationMessage[]
    role: Exclude<FlueConversationMessage['role'], 'system'>
    submissionId: FlueConversationMessage['submissionId']
}

export interface MessageGroupItem extends ConversationMessageGroup {
    kind: 'message'
}

export interface MessageMarkerItem {
    id: string
    kind: 'marker'
    marker: NonNullable<FlueConversationMessage['settlement']> | FailedSend
}

type MessageListItem = MessageGroupItem | MessageMarkerItem

const isAbortFailure = (error: Error) =>
    error.message.includes('[submission_aborted]') ||
    error.message.includes('Submission was aborted') ||
    get(error, 'body.error.type') === 'submission_aborted'

const isEmptyAssistantMessage = (message: FlueConversationMessage) =>
    message.role === 'assistant' && message.parts.length === 0

const getMessageListItems = (
    messages: FlueConversationMessage[],
    failedSend: FailedSend | undefined
): MessageListItem[] => {
    const items: MessageListItem[] = []

    const pushMarker = (id: string, marker: MessageMarkerItem['marker']) => {
        items.push({ id, kind: 'marker', marker })
    }

    for (const message of messages) {
        if (message.settlement) {
            pushMarker(`settlement:${message.id}`, message.settlement)

            continue
        }

        if (
            message.display !== 'visible' ||
            (message.role !== 'assistant' && message.role !== 'user') ||
            isEmptyAssistantMessage(message)
        ) {
            continue
        }

        if (message.role === 'user') {
            items.push({
                id: message.id,
                kind: 'message',
                messages: [message],
                role: message.role,
                submissionId: message.submissionId,
            })

            if (isNotNil(failedSend) && failedSend.id === message.id) {
                pushMarker(
                    `failed-send:${message.id}`,
                    isAbortFailure(failedSend.error)
                        ? { outcome: 'aborted' }
                        : failedSend
                )
            }

            continue
        }

        const previousItem = last(items)
        const previousGroup =
            previousItem && previousItem.kind === 'message'
                ? previousItem
                : undefined

        const isSameAssistantRun =
            previousGroup &&
            previousGroup.role === message.role &&
            previousGroup.submissionId === message.submissionId

        if (isSameAssistantRun) {
            previousGroup.messages.push(message)

            continue
        }

        items.push({
            id: message.id,
            kind: 'message',
            messages: [message],
            role: message.role,
            submissionId: message.submissionId,
        })
    }

    return items
}

export default getMessageListItems
