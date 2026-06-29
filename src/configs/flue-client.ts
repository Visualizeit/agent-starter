import { createFlueClient } from '@flue/sdk'

import { env } from '@/env'

const flueClient = createFlueClient({
    baseUrl: env.VITE_FLUE_BASE_URL,
})

export default flueClient
