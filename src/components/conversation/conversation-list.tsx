import {
    Box,
    Collapse,
    Group,
    Stack,
    ThemeIcon,
    UnstyledButton,
    Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cn } from 'cnfast'
import { isEmpty } from 'es-toolkit/compat'
import { ChevronRightIcon } from 'lucide-react'

import orpc from '@/lib/orpc'

import ConversationListItem from './conversation-list-item'

interface ConversationListProps {
    isPinned?: boolean
}

const ConversationList = ({ isPinned = false }: ConversationListProps) => {
    const [isExpanded, { toggle }] = useDisclosure(true)

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
        <Stack gap="xxs" className="group/conversation-list">
            <UnstyledButton
                className="w-full"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse list' : 'Expand list'}
                onClick={toggle}
            >
                <Group gap="xxs" px="xs">
                    <Text size="sm">{isPinned ? 'Pinned' : 'Recents'}</Text>
                    <ThemeIcon
                        variant="transparent"
                        c="gray"
                        size="sm"
                        className={cn(
                            isExpanded &&
                                'invisible group-hover/conversation-list:visible group-focus-within/conversation-list:visible'
                        )}
                    >
                        <ChevronRightIcon
                            className={cn(
                                'size-4 transition-transform',
                                isExpanded && 'rotate-90'
                            )}
                        />
                    </ThemeIcon>
                </Group>
            </UnstyledButton>
            <Collapse expanded={isExpanded} keepMounted={false}>
                <Box component="ul">
                    {conversations.map((conversation) => (
                        <ConversationListItem
                            conversation={conversation}
                            key={conversation.id}
                        />
                    ))}
                </Box>
            </Collapse>
        </Stack>
    )
}

export default ConversationList
