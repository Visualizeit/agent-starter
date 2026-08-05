import type { ORPCOutputs } from '@/lib/orpc'

export type ConversationSummary =
    ORPCOutputs['conversation']['list']['list'][number]
