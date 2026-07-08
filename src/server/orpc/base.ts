import { os } from '@orpc/server'

import type { ORPCContext } from './context'

const base = os.$context<ORPCContext>().errors({
    BAD_REQUEST: {
        message: 'Bad request',
    },
    CONFLICT: {
        message: 'Conflict',
    },
    NOT_FOUND: {
        message: 'Not found',
    },
})

export default base
