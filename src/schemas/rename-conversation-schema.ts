import { z } from 'zod'

export const conversationTitleSchema = z.string().trim().min(1).max(200)

export const renameConversationSchema = z.object({
    title: conversationTitleSchema,
})
