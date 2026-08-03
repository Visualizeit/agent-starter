import { ChevronRightIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    Collapse,
    Group,
    Stack,
    ThemeIcon,
    UnstyledButton,
    Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cn } from 'cnfast'
import { isEmpty } from 'es-toolkit/compat'

import orpc from '@/lib/orpc'

import ConversationListItem from './conversation-list-item'

const PinnedConversationList = () => {
    const [isExpanded, { toggle }] = useDisclosure(true)

    const { data: conversations } = useSuspenseQuery(
        orpc.conversation.list.queryOptions({
            input: { status: 'active' },
            select: (data) =>
                data.list.filter((conversation) => conversation.isPinned),
        })
    )

    if (isEmpty(conversations)) {
        return null
    }

    return (
        <Stack gap="xxs" className="group/pinned-conversation-list">
            <UnstyledButton
                className="group/pinned-conversation-list-toggle w-full"
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Collapse pinned' : 'Expand pinned'}
                onClick={toggle}
            >
                <Group gap="xxs" px="xs">
                    <Title order={6} c="dimmed">
                        Pinned
                    </Title>
                    <ThemeIcon
                        variant="transparent"
                        c="dimmed"
                        size="sm"
                        className={cn(
                            isExpanded &&
                                'invisible group-hover/pinned-conversation-list:visible group-focus-visible/pinned-conversation-list-toggle:visible'
                        )}
                    >
                        <HugeiconsIcon
                            icon={ChevronRightIcon}
                            className={cn(
                                'size-4 transition-transform',
                                isExpanded && 'rotate-90'
                            )}
                        />
                    </ThemeIcon>
                </Group>
            </UnstyledButton>
            <Collapse expanded={isExpanded} keepMounted={false}>
                <Stack component="ul" gap="xxxs">
                    {conversations.map((conversation) => (
                        <ConversationListItem
                            conversation={conversation}
                            key={conversation.id}
                        />
                    ))}
                </Stack>
            </Collapse>
        </Stack>
    )
}

export default PinnedConversationList
