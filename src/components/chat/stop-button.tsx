import type { FlueClient } from '@flue/react'
import { ActionIcon } from '@mantine/core'
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
        <ActionIcon
            aria-label="Stop response"
            disabled={stopMutation.isPending}
            loading={stopMutation.isPending}
            onClick={() => stopMutation.mutate()}
            variant="filled"
            radius="full"
            size="lg"
            type="button"
        >
            <SquareIcon className="size-4 fill-current" />
        </ActionIcon>
    )
}

export default StopButton
