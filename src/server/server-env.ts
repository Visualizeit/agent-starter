import { loadEnvFile } from 'node:process'

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

loadEnvFile('.env')

const serverEnv = createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
        DB_FILE_NAME: z.string().min(1).default('app.db'),
        FILE_STORAGE_DIRECTORY: z.string().min(1).default('.data/uploads'),
        FILE_UPLOAD_MAX_BYTES: z.coerce
            .number()
            .int()
            .positive()
            .default(20 * 1024 * 1024),
    },
})

export default serverEnv
