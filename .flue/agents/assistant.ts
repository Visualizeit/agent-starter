import { defineAgent } from '@flue/runtime'
import type { AgentRouteHandler } from '@flue/runtime'

export const description = 'General project assistant.'

export const route: AgentRouteHandler = (_context, next) => next()

const assistant = defineAgent(() => ({
    model: process.env.FLUE_MODEL,
}))

export default assistant
