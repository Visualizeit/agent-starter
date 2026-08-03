import type { FlueClient } from '@flue/react'
import { ActionIcon, Tooltip } from '@mantine/core'
import { useMutation } from '@tanstack/react-query'
import { SquareIcon } from 'lucide-react'

interface StopButtonProps {
    client: FlueClient
}

const StopButton = ({ client }: StopButtonProps) => {
    const stopMutation = useMutation({
        mutationFn: () => client.abort(),
    })

    return (
        <Tooltip label="Stop response">
            <ActionIcon
                aria-label="Stop response"
                disabled={stopMutation.isPending}
                onClick={() => stopMutation.mutate()}
                variant="filled"
                radius="full"
                color="var(--mantine-color-text)"
                size="lg"
                type="button"
            >
                <SquareIcon className="size-4 fill-current text-(--mantine-color-body)" />
            </ActionIcon>
        </Tooltip>
    )
}

export default StopButton
