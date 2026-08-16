import {
    defineChatMiddleware,
    requestRunCancel,
    RUN_CANCEL_REASON,
} from '@tanstack/ai'

import chatPersistence from './chat-persistence'

const chatRunAbortControllers = new Map<string, AbortController>()
const cancellationRetentionMilliseconds = 60_000

const deleteChatRunAbortController = (runId: string) => {
    chatRunAbortControllers.delete(runId)
}

export const chatRunCancellationMiddleware = defineChatMiddleware({
    name: 'chat-run-cancellation',
    onAbort: (context) => {
        deleteChatRunAbortController(context.runId)
    },
    onError: (context) => {
        deleteChatRunAbortController(context.runId)
    },
    onFinish: (context) => {
        deleteChatRunAbortController(context.runId)
    },
})

export const getOrCreateChatRunAbortController = (runId: string) => {
    const existingAbortController = chatRunAbortControllers.get(runId)

    if (existingAbortController) {
        return existingAbortController
    }

    const abortController = new AbortController()

    chatRunAbortControllers.set(runId, abortController)

    return abortController
}

const cancelChatRun = async (runId: string) => {
    await requestRunCancel(chatPersistence.stores.runs, runId)

    const abortController = getOrCreateChatRunAbortController(runId)

    abortController.abort(RUN_CANCEL_REASON)

    setTimeout(() => {
        if (chatRunAbortControllers.get(runId) === abortController) {
            deleteChatRunAbortController(runId)
        }
    }, cancellationRetentionMilliseconds)
}

export default cancelChatRun
