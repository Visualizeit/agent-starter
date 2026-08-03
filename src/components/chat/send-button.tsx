import { ArrowUp02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { useOs } from '@mantine/hooks'

interface SendButtonProps {
    disabled: boolean
}

const SendButton = ({ disabled }: SendButtonProps) => {
    const operatingSystem = useOs()

    const shortcut = operatingSystem === 'macos' ? '⌘+Enter' : 'Ctrl+Enter'

    return (
        <Tooltip label={`Send message · ${shortcut}`}>
            <ActionIcon
                aria-label="Send message"
                className="group disabled:bg-(--mantine-color-default-hover)"
                disabled={disabled}
                variant="filled"
                radius="full"
                color="var(--mantine-color-text)"
                size="lg"
                type="submit"
            >
                <HugeiconsIcon
                    icon={ArrowUp02Icon}
                    className="size-4 text-(--mantine-color-body) group-disabled:text-inherit"
                />
            </ActionIcon>
        </Tooltip>
    )
}

export default SendButton
