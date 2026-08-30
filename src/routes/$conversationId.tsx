import { Box, Stack } from '@mantine/core'
import { useChat } from '@tanstack/ai-react'
import { useMutation } from '@tanstack/react-query'
import {
    ClientOnly,
    createFileRoute,
    getRouteApi,
} from '@tanstack/react-router'
import { isNotNil } from 'es-toolkit/predicate'

import MessageList from '@/components/chat/message-list'
import PromptInput from '@/components/chat/prompt-input'
import { NEW_CHAT_LABEL } from '@/components/conversation/conversation-constants'
import byok from '@/lib/byok'
import chatConnection from '@/lib/chat-connection'
import orpc from '@/lib/orpc'
import type { ModelConfiguration } from '@/schemas/model-config-schema'
import useModelStore from '@/stores/model-store'

const conversationRouteApi = getRouteApi('/$conversationId')

const Conversation = () => {
    const { conversationId } = conversationRouteApi.useParams()
    const selectedModel = useModelStore((state) => state.getSelectedModel())
    const forwardedProps: Partial<ModelConfiguration> = selectedModel
        ? {
              baseUrl: selectedModel.baseUrl,
              credentialId: selectedModel.credentialId,
              model: selectedModel.model,
              protocol: selectedModel.protocol,
          }
        : {}

    const cancelChatRunMutation = useMutation(
        orpc.chatRun.cancel.mutationOptions({
            onError: (cancellationError) => {
                console.error('Failed to cancel chat run', cancellationError)
            },
        })
    )

    const {
        error,
        isLoading,
        messages,
        runId,
        sendMessage,
        sessionGenerating,
        stop,
    } = useChat({
        byok,
        byokProvider: () =>
            selectedModel ? selectedModel.credentialId : undefined,
        connection: chatConnection,
        forwardedProps,
        persistence: true,
        threadId: conversationId,
    })

    const isResponding = isLoading || sessionGenerating

    const stopResponse = () => {
        if (isNotNil(runId)) {
            cancelChatRunMutation.mutate({ runId })
        }

        stop()
    }

    return (
        <Stack className="absolute size-full" gap={0}>
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
        const conversationRecord = await context.queryClient.query(
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
