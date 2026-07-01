import { os } from '@orpc/server'

interface ORPCContext {
    request: Request
}

const baseProcedure = os.$context<ORPCContext>()

export { baseProcedure }
