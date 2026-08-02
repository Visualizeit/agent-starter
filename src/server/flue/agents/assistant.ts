'use agent'

import { useModel, useResponseFinish, useResponseStart } from '@flue/runtime'
import type { AgentProps } from '@flue/runtime'
import { isEmpty } from 'es-toolkit/compat'
import * as v from 'valibot'

import getConversationContext from '@/server/flue/conversation-context'

const responseMetricsStartSchema = v.object({
    startedAt: v.number(),
})

const Assistant = ({ id }: AgentProps) => {
    const conversationContext = getConversationContext(id)

    useModel(conversationContext.model)

    useResponseStart(() => ({
        responseMetrics: {
            startedAt: Date.now(),
        },
    }))

    useResponseFinish(({ metadata, response }) => {
        const responseMetrics = v.parse(
            responseMetricsStartSchema,
            metadata.responseMetrics
        )

        return {
            responseMetrics: {
                completedAt: Date.now(),
                startedAt: responseMetrics.startedAt,
                usage: response.usage,
            },
        }
    })

    return isEmpty(conversationContext.projectInstructions)
        ? undefined
        : `<project_instructions>\n${conversationContext.projectInstructions}\n</project_instructions>`
}

Assistant.agentName = 'assistant'

export default Assistant
