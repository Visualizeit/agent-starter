import { consumeEventIterator } from '@orpc/client'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { match } from 'ts-pattern'

import orpc from '@/lib/orpc'

const useConversationEvents = () => {
    const queryClient = useQueryClient()

    useEffect(() => {
        const unsubscribe = consumeEventIterator(
            orpc.event.conversation.call(),
            {
                onError: (error) => {
                    console.error(
                        'Failed to consume conversation events',
                        error
                    )
                },
                onEvent: (event) => {
                    match(event)
                        .with(
                            { type: 'conversation.title.generated' },
                            async () => {
                                await queryClient.invalidateQueries(
                                    orpc.conversation.list.queryOptions({
                                        input: { status: 'active' },
                                    })
                                )
                            }
                        )
                        .exhaustive()
                },
            }
        )

        return () => {
            unsubscribe()
        }
    }, [queryClient])
}

export default useConversationEvents
