import { createFileRoute } from '@tanstack/react-router'
import { createRouteHandler } from 'files-sdk/tanstack-start'

import filesRouter from '@/server/files/router'

export const Route = createFileRoute('/api/files')({
    server: {
        handlers: createRouteHandler(filesRouter),
    },
})
