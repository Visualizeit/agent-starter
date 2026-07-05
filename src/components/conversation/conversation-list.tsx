import { Box, Stack, Title } from '@mantine/core'
import { useSuspenseQuery } from '@tanstack/react-query'
import { isEmpty } from 'es-toolkit/compat'

import orpc from '@/lib/orpc'

import ConversationListItem from './conversation-list-item'

interface ConversationListProps {
    isPinned?: boolean
}

const ConversationList = ({ isPinned = false }: ConversationListProps) => {
    const { data: conversations } = useSuspenseQuery(
        orpc.conversation.list.queryOptions({
            input: { status: 'active' },
            select: (data) =>
                data.list.filter(
                    (conversation) => conversation.isPinned === isPinned
                ),
        })
    )

    if (isEmpty(conversations)) {
        return null
    }

    return (
        <Stack gap="xxs">
            <Title order={6} px="xxs" c="dimmed">
                {isPinned ? 'Pinned' : 'Recents'}
            </Title>
            <Box component="ul">
                {conversations.map((conversation) => (
                    <ConversationListItem
                        conversation={conversation}
                        key={conversation.id}
                    />
                ))}
            </Box>
        </Stack>
    )
}

export default ConversationList
