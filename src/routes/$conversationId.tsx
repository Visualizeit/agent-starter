import { Box, Stack } from '@mantine/core'
import { fetchServerSentEvents, useChat } from '@tanstack/ai-react'
import { useMutation } from '@tanstack/react-query'
import {
    ClientOnly,
    createFileRoute,
    getRouteApi,
} from '@tanstack/react-router'

import MessageList from '@/components/chat/message-list'
import PromptInput from '@/components/chat/prompt-input'
import { NEW_CHAT_LABEL } from '@/components/conversation/conversation-constants'
import orpc from '@/lib/orpc'

const conversationRouteApi = getRouteApi('/$conversationId')
const chatConnection = fetchServerSentEvents('/api/chat')

const Conversation = () => {
    const { conversationId } = conversationRouteApi.useParams()

    const {
        error,
        isLoading,
        messages,
        runId,
        sendMessage,
        sessionGenerating,
        stop,
    } = useChat({
        connection: chatConnection,
        persistence: true,
        threadId: conversationId,
    })
    const cancelChatRunMutation = useMutation(
        orpc.chat.cancel.mutationOptions()
    )

    const isResponding = isLoading || sessionGenerating

    const stopResponse = () => {
        if (runId) {
            cancelChatRunMutation.mutate({ runId })
        }

        stop()
    }

    return (
        <Stack className="size-full absolute" gap={0}>
            <Box className="flex-1 overflow-hidden">
                <MessageList
                    error={error}
                    isResponding={isResponding}
                    messages={messages}
                />
            </Box>
            <Box className="container mx-auto max-w-3xl px-(--mantine-spacing-md) pb-(--mantine-spacing-md)">
                <PromptInput
                    isResponding={isResponding}
                    sendMessage={sendMessage}
                    stop={stopResponse}
                />
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
    remountDeps: ({ params }) => ({ conversationId: params.conversationId }),
})
