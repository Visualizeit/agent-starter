'use agent'

import {
    defineAgent,
    useInitialData,
    useModel,
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

const Assistant = () => {
    const initialData = useInitialData<AssistantInitialData>()

    useModel(serverEnv.FLUE_MODEL)
    useSandbox(sandbox, { cwd: initialData.projectPath ?? undefined })

    return ''
}

export default defineAgent(Assistant)
