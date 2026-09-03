import { Box } from '@mantine/core'
import type { PartProps } from '@tanstack/ai-react/ui'

import type chatOptions from '@/lib/chat-options'

import AssistantMessageProcess from './assistant-message-process'
import MessageRenderContext from './message-render-context'
import MessageResponse from './message-response'

const ThinkingMessagePart = ({
    part,
}: PartProps<typeof chatOptions, 'thinking'>) => {
    const { isResponding } = MessageRenderContext.useMessageRenderContext()

    return (
        <AssistantMessageProcess isResponding={isResponding}>
            <Box className="text-muted-foreground text-sm">
                <MessageResponse
                    isStreaming={isResponding}
                    markdown={part.content}
                />
            </Box>
        </AssistantMessageProcess>
    )
}

export default ThinkingMessagePart
