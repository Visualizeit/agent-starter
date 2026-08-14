import { InMemoryRunStore } from '@tanstack/ai'
import {
    defineAIPersistence,
    defineMessageStore,
} from '@tanstack/ai-persistence'

import database from '@/server/db/client'
import { aiChatThreads } from '@/server/db/schema'

const messageStore = defineMessageStore({
    loadThread: async (threadId) => {
        const thread = await database.query.aiChatThreads.findFirst({
            columns: {
                messages: true,
            },
            where: {
                threadId,
            },
        })

        return thread ? thread.messages : []
    },
    saveThread: async (threadId, messages) => {
        await database
            .insert(aiChatThreads)
            .values({
                messages,
                threadId,
            })
            .onConflictDoUpdate({
                set: {
                    messages,
                },
                target: aiChatThreads.threadId,
            })
    },
})

const chatPersistence = defineAIPersistence({
    stores: {
        messages: messageStore,
        runs: new InMemoryRunStore(),
    },
})

export default chatPersistence
