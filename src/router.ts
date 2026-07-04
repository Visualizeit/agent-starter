import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'

export const getRouter = () => {
    const queryClient = new QueryClient()

    const router = createRouter({
        context: {
            queryClient,
        },
        defaultPreload: 'intent',
        defaultPreloadStaleTime: 0,
        routeTree,
        scrollRestoration: true,
    })

    setupRouterSsrQueryIntegration({
        queryClient,
        router,
    })

    return router
}
