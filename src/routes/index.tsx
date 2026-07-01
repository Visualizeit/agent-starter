import { useFlueAgent } from '@flue/react'
import { Box, Stack } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

import PromptInput from '@/components/chat/prompt-input'
import MessageList from '@/components/flue/message-list'

const Component = () => {
    const agent = useFlueAgent({
        id: 'default',
        name: 'assistant',
    })

    return (
        <Stack className="size-full absolute" gap={0}>
            <Box className="flex-1 overflow-hidden">
                <MessageList messages={agent.messages} />
            </Box>
            <Box className="container mx-auto max-w-3xl" pb="md">
                <PromptInput agent={agent} />
            </Box>
        </Stack>
    )
}

export const Route = createFileRoute('/')({
    component: Component,
})
