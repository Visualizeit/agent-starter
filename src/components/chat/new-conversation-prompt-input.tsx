import { Group, Paper, Stack } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { EventType } from '@tanstack/ai'
import { useChat } from '@tanstack/ai-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { isEmpty } from 'es-toolkit/compat'
import { invariant } from 'es-toolkit/util'
import { nanoid } from 'nanoid'
import { useMemo, useRef } from 'react'
import type { MouseEventHandler, SubmitEventHandler } from 'react'

import byok from '@/lib/byok'
import chatConnection from '@/lib/chat-connection'
import orpc from '@/lib/orpc'
import type { NewConversationForwardedProps } from '@/schemas/model-config-schema'
import useModelStore from '@/stores/model-store'

import ModelSelector from './model-selector'
import ProseKitTextarea from './prosekit-textarea'
import type { ProseKitTextareaHandle } from './prosekit-textarea'
import SendButton from './send-button'

const NewConversationPromptInput = () => {
    const proseKitTextareaRef = useRef<ProseKitTextareaHandle>(null)
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

    const submitMessage = (value: string) => {
        const submittedMessage = value.trim()

        if (isEmpty(submittedMessage) || isLoading || !hasSelectedModel) {
            return
        }

        if (error) {
            clear()
        }

        void sendMessage(submittedMessage)
    }

    const handleSubmit: SubmitEventHandler = (event) => {
        event.preventDefault()

        submitMessage(message)
    }

    const handleContainerClick: MouseEventHandler<HTMLFormElement> = (
        event
    ) => {
        const { target } = event

        if (!(target instanceof HTMLElement) || target.closest('button')) {
            return
        }

        const proseKitTextarea = proseKitTextareaRef.current

        invariant(proseKitTextarea, 'ProseKit textarea ref is not set')

        proseKitTextarea.focus()
    }

    return (
        <Paper
            className="cursor-text"
            component="form"
            onClick={handleContainerClick}
            onSubmit={handleSubmit}
            radius="3xl"
            withBorder
        >
            <Stack gap="sm" p="sm">
                <ProseKitTextarea
                    aria-label="Message the assistant"
                    autoFocus
                    onChange={setMessage}
                    onSubmit={submitMessage}
                    placeholder="Ask the assistant"
                    ref={proseKitTextareaRef}
                />
                <Group justify="space-between">
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
            </Stack>
        </Paper>
    )
}

export default NewConversationPromptInput
