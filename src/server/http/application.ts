import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

import chatRouter from '@/server/ai/chat-router'
import router from '@/server/orpc/router'

const rpcHandler = new RPCHandler(router)

const orpcMiddleware: MiddlewareHandler = async (context, next) => {
    const { matched, response } = await rpcHandler.handle(context.req.raw, {
        prefix: '/api/rpc',
    })

    if (matched && response) {
        return context.newResponse(response.body, response)
    }

    return await next()
}

const application = new Hono()
    .use('/api/rpc/*', orpcMiddleware)
    .route('/api/chat', chatRouter)

export default application
