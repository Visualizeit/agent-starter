import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

export const env = createEnv({
    client: {
        VITE_FLUE_BASE_URL: z.url().default('http://localhost:3583'),
    },
    clientPrefix: 'VITE_',
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
})
