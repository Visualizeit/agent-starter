import { Copy01Icon, Tick02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, CopyButton, Tooltip } from '@mantine/core'

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
                        <HugeiconsIcon icon={Tick02Icon} className="size-4" />
                    ) : (
                        <HugeiconsIcon icon={Copy01Icon} className="size-4" />
                    )}
                </ActionIcon>
            </Tooltip>
        )}
    </CopyButton>
)

export default MessageCopyButton
