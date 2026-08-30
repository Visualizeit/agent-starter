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

import byok from '@/lib/byok'
import chatConnection from '@/lib/chat-connection'
import orpc from '@/lib/orpc'
import type { NewConversationForwardedProps } from '@/schemas/model-config-schema'
import useModelStore from '@/stores/model-store'

import ModelSelector from './model-selector'
import SendButton from './send-button'

const NewConversationPromptInput = () => {
    const [message, setMessage] = useInputState('')
    const selectedModel = useModelStore((state) => state.getSelectedModel())
    const hasSelectedModel = selectedModel !== null
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

    const forwardedProps: NewConversationForwardedProps = selectedModel
        ? {
              baseUrl: selectedModel.baseUrl,
              credentialId: selectedModel.credentialId,
              model: selectedModel.model,
              newConversation: true,
              projectId,
              protocol: selectedModel.protocol,
          }
        : { newConversation: true, projectId }

    const { clear, error, isLoading, sendMessage } = useChat({
        byok,
        byokProvider: () =>
            selectedModel ? selectedModel.credentialId : undefined,
        connection: chatConnection,
        forwardedProps,
        onChunk: (chunk) => {
            if (chunk.type === EventType.RUN_STARTED) {
                void handleRunStarted()
            }
        },
        onError: (chatError) => {
            console.error('Failed to start conversation', chatError)
        },
        queue: 'drop',
        threadId,
    })

    let disabledDescription = 'Enter a message to send.'

    if (!hasSelectedModel) {
        disabledDescription = 'Select a model to send.'
    }

    if (isLoading) {
        disabledDescription = 'Wait for the current message to send.'
    }

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: () => {
            if (isEmpty(trimmedMessage) || isLoading || !hasSelectedModel) {
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
                    <Group className="w-full" justify="space-between">
                        <ModelSelector disabled={isLoading} />
                        <SendButton
                            disabled={
                                isEmpty(trimmedMessage) ||
                                isLoading ||
                                !hasSelectedModel
                            }
                            disabledDescription={disabledDescription}
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
