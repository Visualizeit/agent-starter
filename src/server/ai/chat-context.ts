import database from '@/server/db/client'

const getChatContext = async (conversationId: string) => {
    const conversation = await database.query.conversations.findFirst({
        columns: {
            status: true,
        },
        where: {
            id: conversationId,
        },
        with: {
            project: {
                columns: {
                    instructions: true,
                },
            },
        },
    })

    if (!conversation) {
        return null
    }

    return {
        projectInstructions: conversation.project
            ? conversation.project.instructions
            : '',
        status: conversation.status,
    }
}

export default getChatContext
