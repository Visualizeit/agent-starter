import { Textarea, Group, rem } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { invariant } from 'es-toolkit'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'

import orpc from '@/lib/orpc'
import { chatSubmissionSchema } from '@/schemas/chat-submission-schema'

import ModelSelector from './model-selector'
import SendButton from './send-button'

const NewConversationPromptInput = () => {
    const [message, setMessage] = useInputState('')

    const [model, setModel] = useInputState<string | null>(null)

    const projectId = useSearch({
        from: '/',
        select: (search) => search.projectId,
    })

    const submissionParseResult = chatSubmissionSchema.safeParse({
        message,
        model,
    })

    const navigate = useNavigate()

    const createConversationMutation = useMutation(
        orpc.conversation.create.mutationOptions({
            onSuccess: async (
                createdConversation,
                variables,
                _onMutateResult,
                context
            ) => {
                await Promise.all([
                    context.client.invalidateQueries(
                        orpc.conversation.list.queryOptions({
                            input: {
                                projectId: variables.projectId,
                                status: 'active',
                            },
                        })
                    ),
                    context.client.invalidateQueries(
                        orpc.project.list.queryOptions()
                    ),
                ])

                await navigate({
                    params: { conversationId: createdConversation.id },
                    to: '/$conversationId',
                })
            },
        })
    )

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: async () => {
            if (!submissionParseResult.success) {
                return
            }

            await createConversationMutation.mutateAsync({
                ...submissionParseResult.data,
                projectId,
            })
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
                    <Group className="justify-between w-full">
                        <ModelSelector onChange={setModel} value={model} />
                        <SendButton
                            disabled={
                                !submissionParseResult.success ||
                                createConversationMutation.isPending
                            }
                        />
                    </Group>
                }
            />
        </form>
    )
}

export default NewConversationPromptInput
