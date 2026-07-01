import { DatabaseSync } from 'node:sqlite'

import { drizzle } from 'drizzle-orm/node-sqlite'

import serverEnv from '@/server/server-env'

const databaseClient = new DatabaseSync(serverEnv.DB_FILE_NAME)

const database = drizzle({
    client: databaseClient,
})

export default database
