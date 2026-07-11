import { createFileRoute } from '@tanstack/react-router'

import { getFlueApp } from '@/server/flue/runtime'

export const Route = createFileRoute('/api/agents/$')({
    server: {
        handlers: {
            ANY: async ({ request }) => {
                const app = await getFlueApp()

                return app.fetch(request)
            },
        },
    },
})
