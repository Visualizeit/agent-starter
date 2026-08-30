import chatRunRouter from '@/server/orpc/router/chat-run-router'
import conversationRouter from '@/server/orpc/router/conversation-router'
import eventRouter from '@/server/orpc/router/event-router'
import projectRouter from '@/server/orpc/router/project-router'

const router = {
    chatRun: chatRunRouter,
    conversation: conversationRouter,
    event: eventRouter,
    project: projectRouter,
}

export default router
