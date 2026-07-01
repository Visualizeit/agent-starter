import type { UseFlueAgentResult } from '@flue/react'
import { ActionIcon, Textarea, Group, Space, rem } from '@mantine/core'
import { useInputState } from '@mantine/hooks'
import { invariant } from 'es-toolkit'
import { ArrowUpIcon } from 'lucide-react'
import { useChatSubmit } from 'use-chat-submit'

interface PromptInputProps {
    agent: UseFlueAgentResult
}

const PromptInput = ({ agent }: PromptInputProps) => {
    const [message, setMessage] = useInputState('')

    const { textareaRef, getTextareaProps, triggerSubmit } = useChatSubmit({
        mode: 'mod-enter',
        onSubmit: (value) => {
            setMessage('')

            agent.sendMessage(value)
        },
    })

    return (
        <Textarea
            variant="filled"
            {...getTextareaProps({
                disabled: agent.status === 'submitted',
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
                    '--input-radius': 'var(--mantine-radius-xl)',
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
            placeholder="Ask the assistant"
            bottomSection={
                <Group className="justify-between w-full">
                    <Space />
                    <ActionIcon
                        disabled={
                            !message.trim() || agent.status === 'submitted'
                        }
                        onClick={triggerSubmit}
                        variant="filled"
                        size="lg"
                        type="submit"
                    >
                        <ArrowUpIcon className="size-5" />
                    </ActionIcon>
                </Group>
            }
        />
    )
}

export default PromptInput
