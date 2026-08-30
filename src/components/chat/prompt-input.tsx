import { Textarea, Group, rem } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import type { UseChatReturn } from '@tanstack/ai-react'
import { invariant } from 'es-toolkit/util'
import type { SubmitEventHandler } from 'react'
import { useChatSubmit } from 'use-chat-submit'

import SendButton from './send-button'
import StopButton from './stop-button'

interface PromptInputProps {
    isResponding: boolean
    sendMessage: UseChatReturn['sendMessage']
    stop: () => void
}

const PromptInput = ({ isResponding, sendMessage, stop }: PromptInputProps) => {
    const [message, setMessage] = useInputState('')

    const trimmedMessage = message.trim()

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: () => {
            if (isResponding || trimmedMessage.length === 0) {
                return
            }

            const submittedMessage = trimmedMessage
            setMessage('')
            void sendMessage(submittedMessage)
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
                size="md"
                autosize
                minRows={1}
                rows={1}
                maxRows={10}
                placeholder="Ask the assistant"
                bottomSection={
                    <Group className="w-full" justify="flex-end">
                        {isResponding ? (
                            <StopButton stop={stop} />
                        ) : (
                            <SendButton
                                disabled={trimmedMessage.length === 0}
                                disabledDescription="Enter a message to send."
                            />
                        )}
                    </Group>
                }
            />
        </form>
    )
}

export default PromptInput
