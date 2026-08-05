import { PlusSignIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    ActionIcon,
    FileButton,
    Group,
    Pill,
    rem,
    Scroller,
    Stack,
    Textarea,
    Tooltip,
} from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { invariant } from 'es-toolkit/util'
import { useState } from 'react'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'

import orpc from '@/lib/orpc'
import { chatSubmissionSchema } from '@/schemas/chat-submission-schema'

import ModelSelector from './model-selector'
import SendButton from './send-button'
import useAttachment from './use-attachment'
import useIdempotencyKey from './use-idempotency-key'

const NewConversationPromptInput = () => {
    const [message, setMessage] = useInputState('')
    const [model, setModel] = useInputState<string | null>(null)
    const [draftConversationId, setDraftConversationId] = useState<
        string | null
    >(null)

    const projectId = useSearch({
        from: '/',
        select: (search) => search.projectId,
    })
    const navigate = useNavigate()

    const attachment = useAttachment()
    const { getIdempotencyKey } = useIdempotencyKey()

    const createDraftMutation = useMutation(
        orpc.conversation.createDraft.mutationOptions()
    )
    const sendMutation = useMutation(
        orpc.conversation.send.mutationOptions({
            onSuccess: async (_data, variables, _onMutateResult, context) => {
                await Promise.all([
                    context.client.invalidateQueries(
                        orpc.conversation.list.queryOptions({
                            input: {
                                projectId,
                                status: 'active',
                            },
                        })
                    ),
                    context.client.invalidateQueries(
                        orpc.project.list.queryOptions()
                    ),
                ])

                await navigate({
                    params: { conversationId: variables.id },
                    to: '/$conversationId',
                })
            },
        })
    )

    const submissionParseResult = chatSubmissionSchema.safeParse({
        message,
        model,
    })
    const isPending =
        attachment.isPending ||
        createDraftMutation.isPending ||
        sendMutation.isPending
    const hasAttachment = isNotNil(attachment.filename)
    let inputError = attachment.error

    if (isNil(inputError) && isNotNil(createDraftMutation.error)) {
        inputError = createDraftMutation.error.message
    }

    if (isNil(inputError) && isNotNil(sendMutation.error)) {
        inputError = sendMutation.error.message
    }

    const submit = async () => {
        if (isPending || !submissionParseResult.success) {
            return
        }

        let conversationId = draftConversationId

        if (isNil(conversationId)) {
            const conversation = await createDraftMutation.mutateAsync({
                model: submissionParseResult.data.model,
                projectId,
            })

            conversationId = conversation.id
            setDraftConversationId(conversation.id)
        }

        const attachmentIds = await attachment.register(conversationId)

        if (isNil(attachmentIds)) {
            return
        }

        const submission = {
            attachmentIds,
            ...submissionParseResult.data,
        }

        await sendMutation.mutateAsync({
            ...submission,
            id: conversationId,
            idempotencyKey: getIdempotencyKey(submission),
        })
    }

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: submit,
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
                        '--input-bottom-section-height': hasAttachment
                            ? `calc(${rem(59)} + var(--mantine-spacing-xs) + var(--mantine-spacing-sm))`
                            : `calc(${rem(34)} + var(--mantine-spacing-sm))`,
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
                error={inputError}
                bottomSection={
                    <Stack gap="xs" w="100%">
                        {hasAttachment && (
                            <Scroller
                                controlSize="sm"
                                edgeGradientColor="var(--input-bg)"
                            >
                                <Group gap="xs" wrap="nowrap">
                                    <Pill
                                        disabled={attachment.isPending}
                                        onRemove={() => {
                                            void attachment.remove(
                                                draftConversationId
                                            )
                                        }}
                                        removeButtonProps={{
                                            'aria-label': `Remove ${attachment.filename}`,
                                        }}
                                        size="md"
                                        withRemoveButton
                                    >
                                        {attachment.filename}
                                    </Pill>
                                </Group>
                            </Scroller>
                        )}
                        <Group justify="space-between" wrap="nowrap">
                            <Group gap="xs" wrap="nowrap">
                                <FileButton
                                    disabled={
                                        hasAttachment || attachment.isPending
                                    }
                                    onChange={attachment.handleFileChange}
                                    resetRef={attachment.fileInputResetRef}
                                >
                                    {(props) => (
                                        <Tooltip label="Attach file">
                                            <ActionIcon
                                                {...props}
                                                aria-label="Attach file"
                                                disabled={
                                                    hasAttachment ||
                                                    attachment.isPending
                                                }
                                                loading={attachment.isPending}
                                                color="dimmed"
                                                radius="full"
                                                size="lg"
                                                type="button"
                                                variant="subtle"
                                            >
                                                <HugeiconsIcon
                                                    className="size-4"
                                                    icon={PlusSignIcon}
                                                />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </FileButton>
                                <ModelSelector
                                    onChange={setModel}
                                    value={model}
                                />
                            </Group>
                            <SendButton
                                disabled={
                                    !submissionParseResult.success || isPending
                                }
                            />
                        </Group>
                    </Stack>
                }
            />
        </form>
    )
}

export default NewConversationPromptInput
