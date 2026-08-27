import { ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, Tooltip, VisuallyHidden } from '@mantine/core'
import { useOs } from '@mantine/hooks'
import { useId } from 'react'

interface SendButtonProps {
    disabled: boolean
    disabledDescription: string
}

const SendButton = ({ disabled, disabledDescription }: SendButtonProps) => {
    const operatingSystem = useOs()
    const disabledDescriptionId = useId()

    const shortcut = operatingSystem === 'macos' ? '⌘+Enter' : 'Ctrl+Enter'

    return (
        <>
            <Tooltip label={`Send message · ${shortcut}`}>
                <ActionIcon
                    aria-describedby={
                        disabled ? disabledDescriptionId : undefined
                    }
                    aria-disabled={disabled}
                    aria-label="Send message"
                    className="group dark:data-disabled:bg-(--mantine-color-default-hover)"
                    data-disabled={disabled || undefined}
                    radius="full"
                    color="var(--mantine-color-text)"
                    size="lg"
                    type="submit"
                    onClick={(event) => {
                        if (disabled) {
                            event.preventDefault()
                        }
                    }}
                >
                    <HugeiconsIcon
                        icon={ArrowUp02Icon}
                        className="size-4 text-(--mantine-color-body) group-data-disabled:text-inherit"
                    />
                </ActionIcon>
            </Tooltip>
            {disabled && (
                <VisuallyHidden id={disabledDescriptionId}>
                    {disabledDescription}
                </VisuallyHidden>
            )}
        </>
    )
}

export default SendButton
