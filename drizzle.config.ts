import { loadEnvFile } from 'node:process'

import { defineConfig } from 'drizzle-kit'

loadEnvFile('.env')

const databaseFileName = process.env.DB_FILE_NAME ?? 'app.db'

export default defineConfig({
    dbCredentials: {
        url: databaseFileName,
    },
    dialect: 'sqlite',
    out: './drizzle',
    schema: './src/server/db/schema.ts',
})
