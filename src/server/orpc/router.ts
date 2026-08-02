import conversationRouter from '@/server/orpc/router/conversation-router'
import eventRouter from '@/server/orpc/router/event-router'
import modelRouter from '@/server/orpc/router/model-router'
import projectRouter from '@/server/orpc/router/project-router'

const router = {
    conversation: conversationRouter,
    event: eventRouter,
    model: modelRouter,
    project: projectRouter,
}

export default router
