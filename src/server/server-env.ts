import { loadEnvFile } from 'node:process'

import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

loadEnvFile('.env')

const serverEnv = createEnv({
    emptyStringAsUndefined: true,
    runtimeEnv: process.env,
    server: {
        DB_FILE_NAME: z.string().min(1).default('app.db'),
        DEEPSEEK_API_KEY: z.string().min(1),
        DEEPSEEK_BASE_URL: z.url().default('https://api.deepseek.com/v1'),
        DEEPSEEK_MODEL: z.string().min(1).default('deepseek-chat'),
        DURABLE_STREAM_SERVER: z.url().default('http://127.0.0.1:4437'),
        DURABLE_STREAM_TOKEN: z.string().min(1).optional(),
        FILE_STORAGE_DIRECTORY: z.string().min(1).default('.data/uploads'),
        FILE_UPLOAD_MAX_BYTES: z.coerce
            .number()
            .int()
            .positive()
            .default(20 * 1024 * 1024),
    },
})

export default serverEnv
