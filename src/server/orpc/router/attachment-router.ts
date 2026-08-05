import { and, eq } from 'drizzle-orm'
import { isNil, isNotNil } from 'es-toolkit/predicate'
import { FilesError } from 'files-sdk'
import type { StoredFile } from 'files-sdk'
import { nanoid } from 'nanoid'
import { z } from 'zod'

import database from '@/server/db/client'
import { attachments } from '@/server/db/schema'
import files from '@/server/files/client'

import base from '../base'

const idSchema = z.string().min(1)

const attachmentRouter = {
    delete: base
        .input(
            z.object({
                conversationId: idSchema,
                id: idSchema,
            })
        )
        .handler(async ({ errors, input }) => {
            const attachment = await database.query.attachments.findFirst({
                where: {
                    conversationId: input.conversationId,
                    id: input.id,
                },
            })

            if (isNil(attachment)) {
                throw errors.NOT_FOUND()
            }

            if (
                attachment.status === 'attached' ||
                isNotNil(attachment.idempotencyKey)
            ) {
                throw errors.CONFLICT()
            }

            try {
                await files.delete(
                    `${attachment.conversationId}/${attachment.storageKey}`
                )
            } catch (error) {
                if (
                    !(error instanceof FilesError) ||
                    error.code !== 'NotFound'
                ) {
                    throw error
                }
            }

            const [deletedAttachment] = await database
                .delete(attachments)
                .where(
                    and(
                        eq(attachments.id, attachment.id),
                        eq(attachments.status, 'pending')
                    )
                )
                .returning()

            if (isNil(deletedAttachment)) {
                throw errors.CONFLICT()
            }

            return deletedAttachment
        }),
    list: base
        .input(z.object({ conversationId: idSchema }))
        .handler(async ({ input }) => {
            const records = await database.query.attachments.findMany({
                orderBy: {
                    createdAt: 'asc',
                },
                where: {
                    conversationId: input.conversationId,
                    status: 'attached',
                },
            })

            return { list: records }
        }),
    register: base
        .input(
            z.object({
                conversationId: idSchema,
                filename: z.string().trim().min(1).max(255),
                key: z.string().min(1),
            })
        )
        .handler(async ({ errors, input }) => {
            const conversation = await database.query.conversations.findFirst({
                columns: { id: true },
                where: {
                    id: input.conversationId,
                    status: { ne: 'deleted' },
                },
            })

            if (isNil(conversation)) {
                throw errors.NOT_FOUND()
            }

            let storedFile: StoredFile

            try {
                storedFile = await files.head(`${conversation.id}/${input.key}`)
            } catch (error) {
                if (error instanceof FilesError && error.code === 'NotFound') {
                    throw errors.NOT_FOUND()
                }

                throw error
            }

            const [createdAttachment] = await database
                .insert(attachments)
                .values({
                    conversationId: conversation.id,
                    filename: input.filename,
                    id: nanoid(),
                    mimeType: storedFile.type,
                    size: storedFile.size,
                    storageKey: input.key,
                })
                .onConflictDoNothing({
                    target: [
                        attachments.conversationId,
                        attachments.storageKey,
                    ],
                })
                .returning()

            if (isNotNil(createdAttachment)) {
                return createdAttachment
            }

            const existingAttachment =
                await database.query.attachments.findFirst({
                    where: {
                        conversationId: conversation.id,
                        storageKey: input.key,
                    },
                })

            if (isNil(existingAttachment)) {
                throw errors.CONFLICT()
            }

            return existingAttachment
        }),
}

export default attachmentRouter
