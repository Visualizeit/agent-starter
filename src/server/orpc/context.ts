import { createFlueClient } from '@flue/sdk'
import type { FlueClient } from '@flue/sdk'

import serverEnv from '@/server/server-env'

export interface ORPCContext {
    flue: FlueClient
}

const flue = createFlueClient({
    baseUrl: serverEnv.FLUE_BASE_URL,
})

const createORPCContext = (): ORPCContext => ({
    flue,
})

export default createORPCContext
