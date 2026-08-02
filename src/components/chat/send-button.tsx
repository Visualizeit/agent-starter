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
        size="lg"
        type="submit"
    >
        <ArrowUpIcon className="size-5" />
    </ActionIcon>
)

export default SendButton
