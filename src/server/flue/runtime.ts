import { sqlite, start } from '@flue/runtime/node'
import type { Flue } from '@flue/runtime/node'
import { Hono } from 'hono'

import serverEnv from '@/server/server-env'

import * as assistantAgent from './agents/assistant'
import * as generateTitleAgent from './agents/generate-title'

let flueRuntimePromise: Promise<Flue> | undefined
let flueAppPromise: Promise<Hono> | undefined

export const getFlueRuntime = () => {
    if (flueRuntimePromise) {
        return flueRuntimePromise
    }

    flueRuntimePromise = start({
        agents: [assistantAgent, generateTitleAgent],
        db: sqlite(serverEnv.FLUE_DB_FILE_NAME),
    })

    return flueRuntimePromise
}

export const getFlueApp = () => {
    if (flueAppPromise) {
        return flueAppPromise
    }

    flueAppPromise = getFlueRuntime().then(() => {
        const app = new Hono()

        app.route('/api/agents/assistant', assistantAgent.default.route())

        return app
    })

    return flueAppPromise
}

export const stopFlueRuntime = async () => {
    if (!flueRuntimePromise) {
        return
    }

    const flueRuntime = await flueRuntimePromise

    flueRuntimePromise = undefined
    flueAppPromise = undefined

    await flueRuntime.stop()
}
