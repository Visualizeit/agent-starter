import { ActionIcon, CopyButton, Group, Tooltip } from '@mantine/core'
import { CheckIcon, CopyIcon } from 'lucide-react'

interface MessageCopyButtonProps {
    value: string
}

const MessageCopyButton = ({ value }: MessageCopyButtonProps) => {
    if (value.length === 0) {
        return null
    }

    return (
        <Group
            gap="xxs"
            className="invisible group-hover/message:visible group-focus-within/message:visible"
        >
            <CopyButton value={value}>
                {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copied' : 'Copy'}>
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
        </Group>
    )
}

export default MessageCopyButton
