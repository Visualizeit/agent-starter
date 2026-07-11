import { os } from '@orpc/server'

const base = os.errors({
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
