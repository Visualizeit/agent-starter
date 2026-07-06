import { MemoryPublisher } from '@orpc/experimental-publisher/memory'

// oxlint-disable-next-line typescript/consistent-type-definitions
export type ApplicationEvents = {
    'conversation.title.generated': {
        type: 'conversation.title.generated'
        conversationId: string
    }
}

const publisher = new MemoryPublisher<ApplicationEvents>({
    resumeRetentionSeconds: 120,
})

export default publisher
