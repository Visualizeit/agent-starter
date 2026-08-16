import chatRouter from '@/server/orpc/router/chat-router'
import conversationRouter from '@/server/orpc/router/conversation-router'
import eventRouter from '@/server/orpc/router/event-router'
import projectRouter from '@/server/orpc/router/project-router'

const router = {
    chat: chatRouter,
    conversation: conversationRouter,
    event: eventRouter,
    project: projectRouter,
}

export default router
