import { defineAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'
import { local } from '@flue/runtime/node'

export const description = 'General project assistant.'

export const route: AgentRouteHandler = (_context, next) => next()

const assistant = defineAgent(() => ({
    model: process.env.FLUE_MODEL,
    sandbox: local(),
}))

export default assistant
