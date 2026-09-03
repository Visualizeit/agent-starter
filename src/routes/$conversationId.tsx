import { useChat } from '@tanstack/ai-react'
import {
    ClientOnly,
    createFileRoute,
    getRouteApi,
} from '@tanstack/react-router'

import { NEW_CHAT_LABEL } from '@/components/conversation/conversation-constants'
import chatOptions from '@/lib/chat-options'
import chatUi from '@/lib/chat-ui'
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

    const chat = useChat({
        ...chatOptions,
        forwardedProps,
        threadId: conversationId,
    })

    return <chatUi.Chat chat={chat} />
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
