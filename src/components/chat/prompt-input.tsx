import type { FlueClient, UseFlueAgentResult } from '@flue/react'
import { Textarea, Group, rem } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { invariant } from 'es-toolkit'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'
import { z } from 'zod'

import orpc from '@/lib/orpc'

import ModelSelector from './model-selector'
import SendButton from './send-button'
import StopButton from './stop-button'

interface PromptInputProps {
    agent: UseFlueAgentResult
    client: FlueClient
}

const submissionSchema = z.object({
    message: z.string().trim().min(1),
    model: z.string().trim().min(1),
})

const PromptInput = ({ agent, client }: PromptInputProps) => {
    const { conversationId } = useParams({ from: '/$conversationId' })

    const { data: conversation } = useSuspenseQuery(
        orpc.conversation.find.queryOptions({
            input: { id: conversationId },
            select: (data) => ({ model: data.model }),
        })
    )

    const [message, setMessage] = useInputState('')

    const [selectedModel, setSelectedModel] = useInputState(conversation.model)

    const updateModelMutation = useMutation(
        orpc.conversation.update.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await context.client.invalidateQueries(
                    orpc.conversation.find.queryOptions({
                        input: { id: conversationId },
                    })
                )
            },
        })
    )

    const isResponding =
        agent.status === 'submitted' || agent.status === 'streaming'

    const submissionParseResult = submissionSchema.safeParse({
        message,
        model: selectedModel,
    })

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: async () => {
            if (
                isResponding ||
                updateModelMutation.isPending ||
                !submissionParseResult.success
            ) {
                return
            }

            await updateModelMutation.mutateAsync({
                id: conversationId,
                model: submissionParseResult.data.model,
            })

            setMessage('')
            await agent.sendMessage(submissionParseResult.data.message)
        },
    })

    const handleSubmit: SubmitEventHandler = (event) => {
        event.preventDefault()

        triggerSubmit()
    }

    return (
        <form onSubmit={handleSubmit}>
            <Textarea
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
                        const target = event.target as HTMLElement

                        if (target.closest('button')) {
                            return
                        }

                        const textarea = textareaRef.current

                        invariant(textarea, 'Textarea ref is not set')

                        textarea.focus()
                    },
                }}
                size="md"
                autosize
                minRows={1}
                rows={1}
                maxRows={10}
                placeholder="Ask the assistant"
                bottomSection={
                    <Group className="w-full" justify="space-between">
                        <ModelSelector
                            onChange={setSelectedModel}
                            value={selectedModel}
                        />
                        {isResponding ? (
                            <StopButton client={client} />
                        ) : (
                            <SendButton
                                disabled={
                                    !submissionParseResult.success ||
                                    updateModelMutation.isPending
                                }
                            />
                        )}
                    </Group>
                }
            />
        </form>
    )
}

export default PromptInput
