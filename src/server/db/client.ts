import { DatabaseSync } from 'node:sqlite'

import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-sqlite'

import * as schema from '@/server/db/schema'
import serverEnv from '@/server/server-env'

const client = new DatabaseSync(serverEnv.DB_FILE_NAME)

const relations = defineRelations(schema)

const database = drizzle({
    client,
    relations,
})

export default database
