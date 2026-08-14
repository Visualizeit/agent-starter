import { StopIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, Tooltip } from '@mantine/core'
import type { UseChatReturn } from '@tanstack/ai-react'

interface StopButtonProps {
    stop: UseChatReturn['stop']
}

const StopButton = ({ stop }: StopButtonProps) => (
    <Tooltip label="Stop response">
        <ActionIcon
            aria-label="Stop response"
            onClick={stop}
            variant="filled"
            radius="full"
            color="var(--mantine-color-text)"
            size="lg"
            type="button"
        >
            <HugeiconsIcon
                icon={StopIcon}
                className="size-4 fill-current text-(--mantine-color-body)"
            />
        </ActionIcon>
    </Tooltip>
)

export default StopButton
