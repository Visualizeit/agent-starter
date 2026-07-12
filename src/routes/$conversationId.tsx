import { useFlueAgent } from '@flue/react'
import { Box, Stack } from '@mantine/core'
import {
    ClientOnly,
    createFileRoute,
    getRouteApi,
} from '@tanstack/react-router'

import PromptInput from '@/components/chat/prompt-input'
import { NEW_CHAT_LABEL } from '@/components/conversation/conversation-constants'
import MessageList from '@/components/flue/message-list'
import orpc from '@/lib/orpc'

const conversationRouteApi = getRouteApi('/$conversationId')

const Conversation = () => {
    const { conversationId } = conversationRouteApi.useParams()

    const agent = useFlueAgent({
        url: `/api/agents/assistant/${conversationId}`,
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

const Component = () => (
    <ClientOnly>
        <Conversation />
    </ClientOnly>
)

// oxlint-disable-next-line sort-keys
export const Route = createFileRoute('/$conversationId')({
    component: Component,
    loader: async ({ context, params }) => {
        const conversationRecord = await context.queryClient.fetchQuery(
            orpc.conversation.find.queryOptions({
                input: { id: params.conversationId },
            })
        )

        const conversationTitle = conversationRecord.title ?? NEW_CHAT_LABEL

        return {
            title: conversationRecord.project
                ? `${conversationTitle} · ${conversationRecord.project.name}`
                : conversationTitle,
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
