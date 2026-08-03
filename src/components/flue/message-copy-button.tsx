import { ActionIcon, CopyButton, Tooltip } from '@mantine/core'
import { CheckIcon, CopyIcon } from 'lucide-react'

interface MessageCopyButtonProps {
    value: string
}

const MessageCopyButton = ({ value }: MessageCopyButtonProps) => (
    <CopyButton value={value}>
        {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied' : 'Copy'} position="bottom">
                <ActionIcon
                    aria-label={copied ? 'Copied' : 'Copy message'}
                    color="gray"
                    radius="md"
                    variant="subtle"
                    onClick={copy}
                >
                    {copied ? (
                        <CheckIcon className="size-4" />
                    ) : (
                        <CopyIcon className="size-4" />
                    )}
                </ActionIcon>
            </Tooltip>
        )}
    </CopyButton>
)

export default MessageCopyButton
