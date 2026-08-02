import { loadEnvFile } from 'node:process'

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

loadEnvFile('.env')

const serverEnv = createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
        DB_FILE_NAME: z.string().min(1).default('app.db'),
        FLUE_DB_FILE_NAME: z.string().min(1).default('flue.db'),
    },
})

export default serverEnv
