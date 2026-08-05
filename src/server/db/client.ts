import { DatabaseSync } from 'node:sqlite'

import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-sqlite'

import * as schema from '@/server/db/schema'
import serverEnv from '@/server/server-env'

const client = new DatabaseSync(serverEnv.DB_FILE_NAME)

const relations = defineRelations(schema, (relation) => ({
    attachments: {
        conversation: relation.one.conversations({
            from: relation.attachments.conversationId,
            to: relation.conversations.id,
        }),
    },
    conversations: {
        attachments: relation.many.attachments({
            from: relation.conversations.id,
            to: relation.attachments.conversationId,
        }),
        project: relation.one.projects({
            from: relation.conversations.projectId,
            to: relation.projects.id,
        }),
    },
    projects: {
        conversations: relation.many.conversations({
            from: relation.projects.id,
            to: relation.conversations.projectId,
        }),
    },
}))

const database = drizzle({
    client,
    relations,
})

export default database
