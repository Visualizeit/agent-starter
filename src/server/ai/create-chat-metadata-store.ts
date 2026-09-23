import { defineMetadataStore } from '@tanstack/ai-persistence'
import { and, eq, sql } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-orm/zod'
import { z } from 'zod'

import type database from '@/server/db/client'
import { aiChatMetadata } from '@/server/db/schema'

const metadataSchema = createSelectSchema(aiChatMetadata, {
    key: (schema) => schema.min(1),
    namespace: (schema) => schema.min(1),
    value: z.json(),
})
const metadataIdentitySchema = metadataSchema.pick({
    key: true,
    namespace: true,
})

const createChatMetadataStore = (
    storeDatabase: Pick<typeof database, 'delete' | 'insert' | 'select'>
) =>
    defineMetadataStore({
        delete: async (namespace, key) => {
            metadataIdentitySchema.parse({ key, namespace })
            await storeDatabase
                .delete(aiChatMetadata)
                .where(
                    and(
                        eq(aiChatMetadata.namespace, namespace),
                        eq(aiChatMetadata.key, key)
                    )
                )
        },
        get: async (namespace, key) => {
            metadataIdentitySchema.parse({ key, namespace })
            const [record] = await storeDatabase
                .select({ value: aiChatMetadata.value })
                .from(aiChatMetadata)
                .where(
                    and(
                        eq(aiChatMetadata.namespace, namespace),
                        eq(aiChatMetadata.key, key)
                    )
                )
                .limit(1)

            return record ? record.value : null
        },
        set: async (namespace, key, value) => {
            const metadata = metadataSchema.parse({ key, namespace, value })
            // Bind serialized JSON so JSON null is not converted to SQL NULL.
            const metadataValue = sql`${JSON.stringify(metadata.value)}`

            await storeDatabase
                .insert(aiChatMetadata)
                .values({ key, namespace, value: metadataValue })
                .onConflictDoUpdate({
                    set: { value: metadataValue },
                    target: [aiChatMetadata.namespace, aiChatMetadata.key],
                })
        },
    })

export default createChatMetadataStore
