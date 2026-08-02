import { invariant } from 'es-toolkit/util'

import database from '@/server/db/client'

const getConversationContext = (conversationId: string) => {
    const conversation = database.query.conversations
        .findFirst({
            columns: { model: true },
            where: { id: conversationId },
            with: {
                project: {
                    columns: { instructions: true },
                },
            },
        })
        .sync()

    invariant(
        conversation && conversation.model,
        'Conversation model not found'
    )

    return {
        model: conversation.model,
        projectInstructions: conversation.project
            ? conversation.project.instructions
            : '',
    }
}

export default getConversationContext
