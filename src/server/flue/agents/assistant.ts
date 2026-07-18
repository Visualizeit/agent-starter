'use agent'

import {
    useInitialData,
    useModel,
    useResponseFinish,
    useResponseStart,
    useSandbox,
} from '@flue/runtime'
import { local } from '@flue/runtime/node'
import * as v from 'valibot'

import serverEnv from '@/server/server-env'

const initialDataSchema = v.object({
    projectPath: v.nullable(v.string()),
})

interface AssistantInitialData {
    projectPath: string | null
}

const sandbox = local()
const responseMetricsStartSchema = v.object({
    startedAt: v.number(),
})

const Assistant = () => {
    const initialData = useInitialData<AssistantInitialData>()

    useModel(serverEnv.FLUE_MODEL)

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

    useSandbox(sandbox, { cwd: initialData.projectPath ?? undefined })
}

Assistant.agentName = 'assistant'
Assistant.initialData = initialDataSchema

export default Assistant
