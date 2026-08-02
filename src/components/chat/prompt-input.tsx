import type { FlueClient, UseFlueAgentResult } from '@flue/react'
import { Textarea, Group, Space, rem } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { invariant } from 'es-toolkit'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'
import { z } from 'zod'

import SendButton from './send-button'
import StopButton from './stop-button'

interface PromptInputProps {
    agent: UseFlueAgentResult
    client: FlueClient
}

const messageSchema = z.string().trim().min(1)

const PromptInput = ({ agent, client }: PromptInputProps) => {
    const [message, setMessage] = useInputState('')

    const isResponding =
        agent.status === 'submitted' || agent.status === 'streaming'

    const messageParseResult = messageSchema.safeParse(message)

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: async (value) => {
            if (isResponding) {
                return
            }

            setMessage('')

            await agent.sendMessage(value)
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
                    },
                    wrapper: {
                        '--input-bottom-section-height': `calc(${rem(34)} + var(--mantine-spacing-sm))`,
                        '--input-padding-y-md': 'var(--mantine-spacing-sm)',
                        '--input-radius': 'var(--mantine-radius-4xl)',
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
                        <Space />
                        {isResponding ? (
                            <StopButton client={client} />
                        ) : (
                            <SendButton
                                disabled={!messageParseResult.success}
                            />
                        )}
                    </Group>
                }
            />
        </form>
    )
}

export default PromptInput
