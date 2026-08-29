import { createFileRoute } from '@tanstack/react-router'

import application from '@/server/http/application'

export const Route = createFileRoute('/api/$')({
    server: {
        handlers: {
            ANY: async ({ request }) => await application.fetch(request),
        },
    },
})
