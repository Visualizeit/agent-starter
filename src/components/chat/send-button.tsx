import { ActionIcon } from '@mantine/core'
import { ArrowUpIcon } from 'lucide-react'

interface SendButtonProps {
    disabled: boolean
}

const SendButton = ({ disabled }: SendButtonProps) => (
    <ActionIcon
        aria-label="Send message"
        disabled={disabled}
        variant="filled"
        radius="full"
        color="dark"
        size="lg"
        type="submit"
    >
        <ArrowUpIcon className="size-4" />
    </ActionIcon>
)

export default SendButton
