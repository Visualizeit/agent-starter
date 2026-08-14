import { durableStream } from '@tanstack/ai-durable-stream'

import serverEnv from '@/server/server-env'

const createChatDurability = (request: Request) =>
    durableStream(request, {
        headers: serverEnv.DURABLE_STREAM_TOKEN
            ? { Authorization: `Bearer ${serverEnv.DURABLE_STREAM_TOKEN}` }
            : {},
        server: serverEnv.DURABLE_STREAM_SERVER,
    })

export default createChatDurability
