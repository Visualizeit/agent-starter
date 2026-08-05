import { isNil } from 'es-toolkit/predicate'
import { FilesError } from 'files-sdk'
import { createFilesRouter } from 'files-sdk/api'

import database from '@/server/db/client'
import files from '@/server/files/client'
import serverEnv from '@/server/server-env'

const filesRouter = createFilesRouter({
    authorize: async ({ req }) => {
        const conversationId = req.headers.get('x-conversation-id')

        if (isNil(conversationId)) {
            throw new FilesError('NotFound', 'Conversation not found')
        }

        const conversation = await database.query.conversations.findFirst({
            columns: { id: true },
            where: {
                id: conversationId,
                status: { ne: 'deleted' },
            },
        })

        if (isNil(conversation)) {
            throw new FilesError('NotFound', 'Conversation not found')
        }

        return { keyPrefix: conversationId }
    },
    files,
    maxUploadSize: serverEnv.FILE_UPLOAD_MAX_BYTES,
    operations: ['download', 'upload'],
})

export default filesRouter
