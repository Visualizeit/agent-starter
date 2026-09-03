import { Box, Stack } from '@mantine/core'
import type { LayoutProps } from '@tanstack/ai-react/ui'

import type chatOptions from '@/lib/chat-options'

import MessageList from './message-list'
import type PromptInput from './prompt-input'

const ChatLayout = ({
    Input,
    Messages,
}: LayoutProps<typeof chatOptions, typeof PromptInput>) => (
    <Stack className="absolute size-full" gap={0}>
        <Box className="flex-1 overflow-hidden">
            <MessageList>
                <Messages />
            </MessageList>
        </Box>
        <Box className="container mx-auto max-w-3xl px-(--mantine-spacing-md) pb-(--mantine-spacing-md)">
            <Input />
        </Box>
    </Stack>
)

export default ChatLayout
