import { useFlueAgent } from '@flue/react'
import { Box, Stack } from '@mantine/core'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import PromptInput from '@/components/chat/prompt-input'
import MessageList from '@/components/flue/message-list'

const conversationRouteApi = getRouteApi('/$conversationId')

const Component = () => {
    const { conversationId } = conversationRouteApi.useParams()

    const agent = useFlueAgent({
        id: conversationId,
        name: 'assistant',
    })

    return (
        <Stack className="size-full absolute" gap={0}>
            <Box className="flex-1 overflow-hidden">
                <MessageList
                    messages={agent.messages}
                    streaming={agent.status === 'streaming'}
                />
            </Box>
            <Box className="container mx-auto max-w-3xl" pb="md">
                <PromptInput agent={agent} />
            </Box>
        </Stack>
    )
}

export const Route = createFileRoute('/$conversationId')({
    component: Component,
})
