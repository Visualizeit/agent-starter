import {
    defineAIPersistence,
    defineMessageStore,
} from '@tanstack/ai-persistence'

import database from '@/server/db/client'
import { aiChatThreads } from '@/server/db/schema'

import createChatMetadataStore from './create-chat-metadata-store'
import createChatRunStore from './create-chat-run-store'

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
        metadata: createChatMetadataStore(database),
        runs: createChatRunStore(database),
    },
})

export default chatPersistence
