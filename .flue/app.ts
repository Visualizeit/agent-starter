import { flue } from '@flue/runtime/routing'
import { RPCHandler } from '@orpc/server/fetch'
import { Hono } from 'hono'

import router from '../src/server/orpc/router'

const app = new Hono()

app.get('/health', (context) => context.json({ ok: true }))

const orpcHandler = new RPCHandler(router)

app.use('/rpc/*', async (context, nextMiddleware) => {
    const { matched, response } = await orpcHandler.handle(context.req.raw, {
        context: {
            request: context.req.raw,
        },
        prefix: '/rpc',
    })

    if (matched) {
        return context.newResponse(response.body, response)
    }

    await nextMiddleware()
})

app.route('/', flue())

export default app
