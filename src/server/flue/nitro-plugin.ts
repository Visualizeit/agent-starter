import { definePlugin } from 'nitro'

import { stopFlueRuntime } from './runtime'

export default definePlugin((nitroApp) => {
    nitroApp.hooks.hook('close', stopFlueRuntime)
})
