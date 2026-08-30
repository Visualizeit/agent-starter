import { RPCHandler } from '@orpc/server/fetch'
import { Elysia } from 'elysia'

import chatRouter from '@/server/ai/chat-router'
import filesRouter from '@/server/files/router'
import router from '@/server/orpc/router'

const rpcHandler = new RPCHandler(router)

const application = new Elysia({ name: 'application' })
    .all(
        '/api/files',
        async ({ request }) => await filesRouter.handle(request),
        { parse: 'none' }
    )
    .all(
        '/api/rpc*',
        async ({ request }) => {
            const { response } = await rpcHandler.handle(request, {
                prefix: '/api/rpc',
            })

            return response ?? new Response('Not Found', { status: 404 })
        },
        { parse: 'none' }
    )
    .use(chatRouter)

export default application
