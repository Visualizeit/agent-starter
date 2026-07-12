'use agent'

import {
    defineAgent,
    useInitialData,
    useModel,
    useResponseFinish,
    useResponseStart,
    useSandbox,
} from '@flue/runtime'
import { local } from '@flue/runtime/node'
import * as v from 'valibot'

import serverEnv from '@/server/server-env'

export const name = 'assistant'
export const description = 'General project assistant.'
export const initialDataSchema = v.object({
    projectPath: v.nullable(v.string()),
})

interface AssistantInitialData {
    projectPath: string | null
}

const sandbox = local()
const agentMetricsStartSchema = v.object({
    startedAt: v.number(),
})

const Assistant = () => {
    const initialData = useInitialData<AssistantInitialData>()

    useModel(serverEnv.FLUE_MODEL)

    useResponseStart(() => ({
        agentMetrics: {
            startedAt: Date.now(),
        },
    }))

    useResponseFinish(({ metadata, response }) => {
        const agentMetrics = v.parse(
            agentMetricsStartSchema,
            metadata.agentMetrics
        )

        return {
            agentMetrics: {
                completedAt: Date.now(),
                startedAt: agentMetrics.startedAt,
                usage: response.usage,
            },
        }
    })

    useSandbox(sandbox, { cwd: initialData.projectPath ?? undefined })
}

export default defineAgent(Assistant)
