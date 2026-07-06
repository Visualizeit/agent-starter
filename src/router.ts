import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'

export interface RouterContext {
    queryClient: QueryClient
}

export const getRouter = () => {
    const queryClient = new QueryClient()

    const router = createRouter({
        context: {
            queryClient,
        } satisfies RouterContext,
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
