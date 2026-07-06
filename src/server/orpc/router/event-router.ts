import publisher from '@/server/orpc/publisher'

import base from '../base'

const eventRouter = {
    conversation: base.handler(({ lastEventId, signal }) =>
        publisher.subscribe('conversation.title.generated', {
            lastEventId,
            signal,
        })
    ),
}

export default eventRouter
