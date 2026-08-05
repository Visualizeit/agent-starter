import type { FlueClient, UseFlueAgentResult } from '@flue/react'
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
import {
    useMutation,
    useQueryClient,
    useSuspenseQuery,
} from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { invariant } from 'es-toolkit/util'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'

import orpc from '@/lib/orpc'
import { chatSubmissionSchema } from '@/schemas/chat-submission-schema'

import ModelSelector from './model-selector'
import SendButton from './send-button'
import StopButton from './stop-button'
import useAttachment from './use-attachment'
import useIdempotencyKey from './use-idempotency-key'

interface PromptInputProps {
    agent: UseFlueAgentResult
    client: FlueClient
}

const PromptInput = ({ agent, client }: PromptInputProps) => {
    const { conversationId } = useParams({ from: '/$conversationId' })
    const queryClient = useQueryClient()

    const attachment = useAttachment()
    const { getIdempotencyKey, resetIdempotencyKey } = useIdempotencyKey()

    const { data: conversation } = useSuspenseQuery(
        orpc.conversation.find.queryOptions({
            input: { id: conversationId },
            select: (data) => ({
                model: data.model,
                projectId: data.projectId,
            }),
        })
    )

    const [message, setMessage] = useInputState('')
    const [selectedModel, setSelectedModel] = useInputState(conversation.model)

    const sendMutation = useMutation(orpc.conversation.send.mutationOptions())

    const isResponding =
        agent.status === 'submitted' || agent.status === 'streaming'
    const submissionParseResult = chatSubmissionSchema.safeParse({
        message,
        model: selectedModel,
    })
    const isSendDisabled =
        !submissionParseResult.success ||
        attachment.isPending ||
        sendMutation.isPending
    const hasAttachment = isNotNil(attachment.filename)
    let inputError = attachment.error

    if (isNil(inputError) && isNotNil(sendMutation.error)) {
        inputError = sendMutation.error.message
    }

    const submit = async () => {
        if (
            isResponding ||
            attachment.isPending ||
            sendMutation.isPending ||
            !submissionParseResult.success
        ) {
            return
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

        await Promise.all([
            queryClient.invalidateQueries(
                orpc.attachment.list.queryOptions({
                    input: { conversationId },
                })
            ),
            queryClient.invalidateQueries(
                orpc.conversation.find.queryOptions({
                    input: { id: conversationId },
                })
            ),
            queryClient.invalidateQueries(
                orpc.conversation.list.queryOptions({
                    input: {
                        projectId: isNotNil(conversation.projectId)
                            ? conversation.projectId
                            : undefined,
                        status: 'active',
                    },
                })
            ),
            queryClient.invalidateQueries(orpc.project.list.queryOptions()),
        ])

        agent.refresh()
        attachment.reset()
        resetIdempotencyKey()
        setMessage('')
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
                                                conversationId
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
                                                color="dimmed"
                                                disabled={
                                                    hasAttachment ||
                                                    attachment.isPending
                                                }
                                                loading={attachment.isPending}
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
                                    onChange={setSelectedModel}
                                    value={selectedModel}
                                />
                            </Group>
                            {isResponding ? (
                                <StopButton client={client} />
                            ) : (
                                <SendButton disabled={isSendDisabled} />
                            )}
                        </Group>
                    </Stack>
                }
            />
        </form>
    )
}

export default PromptInput
