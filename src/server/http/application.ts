import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'
import type { MiddlewareHandler } from 'hono'

import chatRouter from '@/server/ai/chat-router'
import router from '@/server/orpc/router'

const rpcHandler = new RPCHandler(router)

// oxlint-disable-next-line typescript/consistent-return -- Hono middleware returns void after delegating.
const orpcMiddleware: MiddlewareHandler = async (context, continueRequest) => {
    const { matched, response } = await rpcHandler.handle(context.req.raw, {
        prefix: '/api/rpc',
    })

    if (matched) {
        return context.newResponse(response.body, response)
    }

    await continueRequest()
}

const application = new Hono()
    .use('/api/rpc/*', orpcMiddleware)
    .route('/api/chat', chatRouter)

export default application
