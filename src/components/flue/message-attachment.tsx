import { Download04Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Button, Tooltip } from '@mantine/core'
import { useMutation } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { isNotNil } from 'es-toolkit/predicate'
import saveAs from 'file-saver'
import { useFiles } from 'files-sdk/react'

import type { AttachmentListItem } from '@/types/attachment'

interface MessageAttachmentProps {
    attachment: AttachmentListItem
}

const MessageAttachment = ({ attachment }: MessageAttachmentProps) => {
    const { conversationId } = useParams({ from: '/$conversationId' })

    const files = useFiles({
        endpoint: '/api/files',
        headers: {
            'x-conversation-id': conversationId,
        },
    })

    const downloadMutation = useMutation({
        mutationFn: async () => {
            const storedFile = await files.download(attachment.storageKey)

            return storedFile.blob()
        },
        onSuccess: (blob) => {
            saveAs(blob, attachment.filename)
        },
    })

    const tooltipLabel = isNotNil(downloadMutation.error)
        ? downloadMutation.error.message
        : 'Download file'

    return (
        <Tooltip label={tooltipLabel}>
            <Button
                leftSection={
                    <HugeiconsIcon className="size-4" icon={Download04Icon} />
                }
                loading={downloadMutation.isPending}
                onClick={() => downloadMutation.mutate()}
                size="compact-sm"
                variant="default"
            >
                {attachment.filename}
            </Button>
        </Tooltip>
    )
}

export default MessageAttachment
