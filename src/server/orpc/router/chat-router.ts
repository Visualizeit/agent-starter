import { z } from 'zod'

import cancelChatRun from '@/server/ai/chat-run-cancellation'

import base from '../base'

const chatRouter = {
    cancel: base
        .input(z.object({ runId: z.string().min(1) }))
        .handler(async ({ input }) => {
            await cancelChatRun(input.runId)
        }),
}

export default chatRouter
