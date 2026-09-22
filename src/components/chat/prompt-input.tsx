import { Group, Paper, Stack } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { useMutation } from '@tanstack/react-query'
import { isNotNil } from 'es-toolkit/predicate'
import { invariant } from 'es-toolkit/util'
import { useRef } from 'react'
import type { MouseEventHandler, SubmitEventHandler } from 'react'

import chatUiContext from '@/lib/chat-ui-context'
import orpc from '@/lib/orpc'
import useModelStore from '@/stores/model-store'

import ModelSelector from './model-selector'
import ProseKitTextarea from './prosekit-textarea'
import type { ProseKitTextareaHandle } from './prosekit-textarea'
import SendButton from './send-button'
import StopButton from './stop-button'

const PromptInput = () => {
    const proseKitTextareaRef = useRef<ProseKitTextareaHandle>(null)
    const [message, setMessage] = useInputState('')
    const selectedModel = useModelStore((state) => state.getSelectedModel())
    const hasSelectedModel = selectedModel !== null
    const { isLoading, runId, sendMessage, sessionGenerating, stop } =
        chatUiContext.useChatContext()
    const isResponding = isLoading || sessionGenerating

    const cancelChatRunMutation = useMutation(
        orpc.chatRun.cancel.mutationOptions({
            onError: (cancellationError) => {
                console.error('Failed to cancel chat run', cancellationError)
            },
        })
    )

    const trimmedMessage = message.trim()

    const stopResponse = () => {
        if (isNotNil(runId)) {
            cancelChatRunMutation.mutate({ runId })
        }

        stop()
    }

    const submitMessage = (value: string) => {
        const submittedMessage = value.trim()

        if (
            isResponding ||
            !hasSelectedModel ||
            submittedMessage.length === 0
        ) {
            return
        }

        const proseKitTextarea = proseKitTextareaRef.current

        invariant(proseKitTextarea, 'ProseKit textarea ref is not set')

        proseKitTextarea.clear()
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
                    <ModelSelector disabled={isResponding} />
                    {isResponding ? (
                        <StopButton stop={stopResponse} />
                    ) : (
                        <SendButton
                            disabled={
                                !hasSelectedModel || trimmedMessage.length === 0
                            }
                            disabledDescription={
                                hasSelectedModel
                                    ? 'Enter a message to send.'
                                    : 'Select a model to send.'
                            }
                        />
                    )}
                </Group>
            </Stack>
        </Paper>
    )
}

export default PromptInput
