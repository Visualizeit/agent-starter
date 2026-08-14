import { createORPCClient } from '@orpc/client'
import type { InferClientOutputs } from '@orpc/client'
import { RPCLink } from '@orpc/client/fetch'
import { ClientRetryPlugin } from '@orpc/client/plugins'
import { createRouterClient } from '@orpc/server'
import type { RouterClient } from '@orpc/server'
import { createTanstackQueryUtils } from '@orpc/tanstack-query'
import { createIsomorphicFn } from '@tanstack/react-start'

import router from '@/server/orpc/router'

const getORPCClient = createIsomorphicFn()
    .server(() => createRouterClient(router))
    .client((): RouterClient<typeof router> => {
        const link = new RPCLink({
            plugins: [new ClientRetryPlugin()],
            url: `${window.location.origin}/api/rpc`,
        })

        return createORPCClient(link)
    })

const client: RouterClient<typeof router> = getORPCClient()

export type ORPCOutputs = InferClientOutputs<typeof client>

const orpc = createTanstackQueryUtils(client)

export default orpc
