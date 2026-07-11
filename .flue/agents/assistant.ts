import { defineAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { local } from '@flue/runtime/node'
import { and, eq, isNull, or } from 'drizzle-orm'
import { invariant } from 'es-toolkit/util'

import database from '@/server/db/client'
import { conversations, projects } from '@/server/db/schema'

export const description = 'General project assistant.'

export const route: AgentRouteHandler = (_context, next) => next()

const assistant = defineAgent(async ({ id }) => {
    const [conversationRecord] = await database
        .select({
            projectPath: projects.path,
        })
        .from(conversations)
        .leftJoin(projects, eq(conversations.projectId, projects.id))
        .where(
            and(
                eq(conversations.id, id),
                eq(conversations.status, 'active'),
                or(
                    isNull(conversations.projectId),
                    eq(projects.status, 'active')
                )
            )
        )
        .limit(1)

    invariant(conversationRecord, `Conversation unavailable: ${id}`)

    return {
        cwd: conversationRecord.projectPath ?? undefined,
        model: process.env.FLUE_MODEL,
        sandbox: local(),
    }
})

export default assistant
