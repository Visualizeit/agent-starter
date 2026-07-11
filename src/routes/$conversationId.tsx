import { useFlueAgent } from '@flue/react'
import { Box, Stack } from '@mantine/core'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'

import PromptInput from '@/components/chat/prompt-input'
import { NEW_CHAT_LABEL } from '@/components/conversation/conversation-constants'
import MessageList from '@/components/flue/message-list'
import orpc from '@/lib/orpc'

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
                <MessageList messages={agent.messages} />
            </Box>
            <Box className="container mx-auto max-w-3xl" pb="md">
                <PromptInput agent={agent} />
            </Box>
        </Stack>
    )
}

// oxlint-disable-next-line sort-keys
export const Route = createFileRoute('/$conversationId')({
    component: Component,
    loader: async ({ context, params }) => {
        const conversationRecord = await context.queryClient.fetchQuery(
            orpc.conversation.find.queryOptions({
                input: { id: params.conversationId },
            })
        )

        return {
            title: conversationRecord.title ?? NEW_CHAT_LABEL,
        }
    },
    head: ({ loaderData }) => {
        const title = loaderData ? loaderData.title : NEW_CHAT_LABEL

        return {
            meta: [
                {
                    title,
                },
            ],
        }
    },
})
