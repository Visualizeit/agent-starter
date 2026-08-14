import { consumeEventIterator } from '@orpc/client'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { match } from 'ts-pattern'

import orpc from '@/lib/orpc'

const useConversationEvents = () => {
    const queryClient = useQueryClient()

    const router = useRouter()

    useEffect(() => {
        const unsubscribe = consumeEventIterator(
            orpc.event.conversation.call(
                {},
                {
                    context: { retry: Number.POSITIVE_INFINITY },
                }
            ),
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
                            async ({ conversationId }) => {
                                await Promise.all([
                                    queryClient.invalidateQueries(
                                        orpc.conversation.find.queryOptions({
                                            input: { id: conversationId },
                                        })
                                    ),
                                    queryClient.invalidateQueries(
                                        orpc.conversation.list.queryOptions({
                                            input: { status: 'active' },
                                        })
                                    ),
                                    queryClient.invalidateQueries(
                                        orpc.project.list.queryOptions()
                                    ),
                                ])

                                await router.invalidate({ sync: true })
                            }
                        )
                        .exhaustive()
                },
            }
        )

        return () => {
            unsubscribe()
        }
    }, [queryClient, router])
}

export default useConversationEvents
