import conversationRouter from '@/server/orpc/router/conversation-router'
import eventRouter from '@/server/orpc/router/event-router'

const router = {
    conversation: conversationRouter,
    event: eventRouter,
}

export default router
