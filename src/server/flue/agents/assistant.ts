'use agent'

import {
    useAgentStart,
    useModel,
    usePersistentState,
    useResponseFinish,
    useResponseStart,
} from '@flue/runtime'
import type { AgentProps } from '@flue/runtime'
import { isEmpty } from 'es-toolkit/compat'
import { isNotNil } from 'es-toolkit/predicate'
import * as v from 'valibot'

import database from '@/server/db/client'
import serverEnv from '@/server/server-env'

const responseMetricsStartSchema = v.object({
    startedAt: v.number(),
})

const Assistant = ({ id }: AgentProps) => {
    const [projectInstructions, setProjectInstructions] = usePersistentState(
        'projectInstructions',
        ''
    )

    useAgentStart(async () => {
        const conversationRecord = await database.query.conversations.findFirst(
            {
                columns: {},
                where: { id },
                with: {
                    project: {
                        columns: { instructions: true },
                    },
                },
            }
        )
        const project = conversationRecord && conversationRecord.project

        setProjectInstructions(isNotNil(project) ? project.instructions : '')
    })

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

    return isEmpty(projectInstructions)
        ? undefined
        : `<project_instructions>\n${projectInstructions}\n</project_instructions>`
}

Assistant.agentName = 'assistant'

export default Assistant
