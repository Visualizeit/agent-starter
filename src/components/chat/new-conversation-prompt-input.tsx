import { Group, rem, Textarea } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { EventType } from '@tanstack/ai'
import { useChat } from '@tanstack/ai-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { isEmpty } from 'es-toolkit/compat'
import { invariant } from 'es-toolkit/util'
import { nanoid } from 'nanoid'
import { useMemo } from 'react'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'

import { newChatConnection } from '@/lib/chat-connection'
import orpc from '@/lib/orpc'

import SendButton from './send-button'

const NewConversationPromptInput = () => {
    const [message, setMessage] = useInputState('')
    const threadId = useMemo(() => nanoid(), [])

    const trimmedMessage = message.trim()

    const navigate = useNavigate()

    const projectId = useSearch({
        from: '/',
        select: (search) => search.projectId,
    })

    const queryClient = useQueryClient()

    const handleRunStarted = async () => {
        await Promise.all([
            queryClient.invalidateQueries(
                orpc.conversation.list.queryOptions({
                    input: { projectId, status: 'active' },
                })
            ),
            queryClient.invalidateQueries(orpc.project.list.queryOptions()),
        ])

        await navigate({
            params: { conversationId: threadId },
            to: '/$conversationId',
        })
    }

    const { clear, error, isLoading, sendMessage } = useChat({
        connection: newChatConnection,
        forwardedProps: { projectId },
        onChunk: (chunk) => {
            if (chunk.type === EventType.RUN_STARTED) {
                handleRunStarted()
            }
        },
        onError: (chatError) => {
            console.error('Failed to start conversation', chatError)
        },
        queue: 'drop',
        threadId,
    })

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: () => {
            if (isEmpty(trimmedMessage) || isLoading) {
                return
            }

            if (error) {
                clear()
            }

            void sendMessage(trimmedMessage)
        },
    })

    const handleSubmit: SubmitEventHandler = (event) => {
        event.preventDefault()

        triggerSubmit()
    }

    return (
        <form onSubmit={handleSubmit}>
            <Textarea
                aria-label="Message the assistant"
                autoFocus
                {...getTextareaProps({
                    onChange: setMessage,
                    value: message,
                })}
                styles={{
                    bottomSection: {
                        alignItems: 'flex-start',
                        color: 'var(--mantine-color-text)',
                        paddingInline: 'var(--mantine-spacing-sm)',
                    },
                    wrapper: {
                        '--input-bd-focus':
                            'var(--mantine-color-default-border)',
                        '--input-bottom-section-height': `calc(${rem(34)} + var(--mantine-spacing-sm))`,
                        '--input-padding-y-md': 'var(--mantine-spacing-sm)',
                        '--input-radius': 'var(--mantine-radius-3xl)',
                        cursor: 'text',
                    },
                }}
                wrapperProps={{
                    onClick: (event) => {
                        const { target } = event

                        if (
                            target instanceof HTMLElement &&
                            target.closest('button')
                        ) {
                            return
                        }

                        const textarea = textareaRef.current

                        invariant(textarea, 'Textarea ref is not set')

                        textarea.focus()
                    },
                }}
                autosize
                bottomSection={
                    <Group className="w-full" justify="flex-end">
                        <SendButton
                            disabled={isEmpty(trimmedMessage) || isLoading}
                            disabledDescription={
                                isLoading
                                    ? 'Wait for the current message to send.'
                                    : 'Enter a message to send.'
                            }
                        />
                    </Group>
                }
                maxRows={10}
                minRows={1}
                placeholder="Ask the assistant"
                rows={1}
                size="md"
            />
        </form>
    )
}

export default NewConversationPromptInput
