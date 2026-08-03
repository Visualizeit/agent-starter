'use agent'

import { useModel, useResponseFinish, useResponseStart } from '@flue/runtime'
import type { AgentProps } from '@flue/runtime'
import { isEmpty } from 'es-toolkit/compat'

import assistantMessageMetadataSchema, {
    assistantMessageMetadataStartSchema,
} from '@/schemas/assistant-message-metadata'
import getConversationContext from '@/server/flue/conversation-context'

const Assistant = ({ id }: AgentProps) => {
    const conversationContext = getConversationContext(id)

    useModel(conversationContext.model)

    useResponseStart(() => ({
        model: conversationContext.model,
        timing: {
            startedAt: Date.now(),
        },
    }))

    useResponseFinish(({ log, metadata, response }) => {
        const metadataStartResult =
            assistantMessageMetadataStartSchema.safeParse(metadata)

        if (!metadataStartResult.success) {
            log.error('Failed to parse assistant message start metadata', {
                issues: metadataStartResult.error.issues,
            })

            return
        }

        const metadataResult = assistantMessageMetadataSchema.safeParse({
            ...metadataStartResult.data,
            timing: {
                ...metadataStartResult.data.timing,
                completedAt: Date.now(),
            },
            usage: response.usage,
        })

        if (!metadataResult.success) {
            log.error('Failed to parse assistant message metadata', {
                issues: metadataResult.error.issues,
            })

            return
        }

        return metadataResult.data
    })

    return isEmpty(conversationContext.projectInstructions)
        ? undefined
        : `<project_instructions>\n${conversationContext.projectInstructions}\n</project_instructions>`
}

Assistant.agentName = 'assistant'

export default Assistant
