import { requestRunCancel } from '@tanstack/ai'
import { z } from 'zod'

import chatPersistence from '@/server/ai/chat-persistence'
import chatRunRegistry from '@/server/ai/chat-run-registry'

import base from '../base'

const chatRunRouter = {
    cancel: base
        .input(z.object({ runId: z.string().min(1) }))
        .handler(async ({ input }) => {
            chatRunRegistry.cancel(input.runId)

            await requestRunCancel(chatPersistence.stores.runs, input.runId)
        }),
}

export default chatRunRouter
