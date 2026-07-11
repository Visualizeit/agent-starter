import { createORPCClient } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { createRouterClient } from '@orpc/server'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'

import router from '@/server/orpc/router'

const getORPCClient = createIsomorphicFn()
    .server(() => createRouterClient(router))
    .client((): RouterClient<typeof router> => {
        const link = new RPCLink({
            url: `${window.location.origin}/api/rpc`,
        })

        return createORPCClient(link)
    })

const client: RouterClient<typeof router> = getORPCClient()

const orpc = createTanstackQueryUtils(client)

export default orpc
