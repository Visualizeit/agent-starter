import { defineChatMiddleware } from '@tanstack/ai'
import type { ModelMessage } from '@tanstack/ai'
import { and, eq, isNull as isDatabaseNull } from 'drizzle-orm'
import { isNil, isNotNil, isNull, isString } from 'es-toolkit/predicate'

import { conversationTitleSchema } from '@/schemas/rename-conversation-schema'
import database from '@/server/db/client'
import { conversations } from '@/server/db/schema'
import publisher from '@/server/orpc/publisher'

import generateConversationTitle from './generate-title'

const getMessageText = (message: ModelMessage) => {
    if (isString(message.content)) {
        return message.content.trim()
    }

    if (isNull(message.content)) {
        return ''
    }

    let text = ''

    for (const part of message.content) {
        if (part.type === 'text') {
            text += part.content
        }
    }

    return text.trim()
}

const generateAndUpdateConversationTitle = async (
    conversationId: string,
    userMessage: string
) => {
    try {
        const conversation = await database.query.conversations.findFirst({
            columns: {
                title: true,
            },
            where: {
                id: conversationId,
            },
        })

        if (isNil(conversation) || !isNull(conversation.title)) {
            return
        }

        const title = conversationTitleSchema.parse(
            await generateConversationTitle({
                conversationId,
                userMessage,
            })
        )
        const [updatedConversation] = await database
            .update(conversations)
            .set({ title })
            .where(
                and(
                    eq(conversations.id, conversationId),
                    isDatabaseNull(conversations.title)
                )
            )
            .returning({ id: conversations.id })

        if (isNil(updatedConversation)) {
            return
        }

        await publisher.publish('conversation.title.generated', {
            conversationId: updatedConversation.id,
            type: 'conversation.title.generated',
        })
    } catch (error) {
        console.error('Failed to generate conversation title', error)
    }
}

const conversationTitleMiddleware = defineChatMiddleware({
    name: 'conversation-title',
    onStart: (context) => {
        let firstUserMessage: ModelMessage | undefined

        for (const message of context.messages) {
            if (message.role === 'assistant') {
                return
            }

            if (message.role === 'user') {
                if (isNotNil(firstUserMessage)) {
                    return
                }

                firstUserMessage = message
            }
        }

        if (isNil(firstUserMessage)) {
            return
        }

        const userMessage = getMessageText(firstUserMessage)

        if (!userMessage) {
            return
        }

        context.defer(
            generateAndUpdateConversationTitle(context.threadId, userMessage)
        )
    },
})

export default conversationTitleMiddleware
