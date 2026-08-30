import { RUN_CANCEL_REASON } from '@tanstack/ai'

const abortControllers = new Map<string, AbortController>()

const createAbortController = (runId: string) => {
    const existingAbortController = abortControllers.get(runId)

    if (existingAbortController !== undefined) {
        existingAbortController.abort(RUN_CANCEL_REASON)
    }

    const abortController = new AbortController()

    abortControllers.set(runId, abortController)

    return abortController
}

const cancel = (runId: string) => {
    const abortController = abortControllers.get(runId)

    if (abortController === undefined) {
        return
    }

    abortControllers.delete(runId)
    abortController.abort(RUN_CANCEL_REASON)
}

const release = (runId: string, abortController: AbortController) => {
    if (abortControllers.get(runId) === abortController) {
        abortControllers.delete(runId)
    }
}

const chatRunRegistry = {
    cancel,
    createAbortController,
    release,
}

export default chatRunRegistry
