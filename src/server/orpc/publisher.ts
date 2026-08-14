import { MemoryPublisher } from '@orpc/experimental-publisher/memory'

interface ConversationTitleGeneratedEvent {
    type: 'conversation.title.generated'
    conversationId: string
}

export interface ApplicationEvents {
    [key: string]: object
    'conversation.title.generated': ConversationTitleGeneratedEvent
}

const publisher = new MemoryPublisher<ApplicationEvents>({
    resumeRetentionSeconds: 120,
})

export default publisher
