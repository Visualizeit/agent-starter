import {
    ActionIcon,
    Collapse,
    Group,
    Stack,
    ThemeIcon,
    Tooltip,
    UnstyledButton,
    Text,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { cn } from 'cnfast'
import { isEmpty } from 'es-toolkit/compat'
import { ChevronRightIcon, PlusIcon } from 'lucide-react'

import orpc from '@/lib/orpc'

import ConversationListItem from './conversation-list-item'

const RecentConversationList = () => {
    const [isExpanded, { toggle }] = useDisclosure(true)

    const { data: conversations } = useSuspenseQuery(
        orpc.conversation.list.queryOptions({
            input: { status: 'active' },
            select: (data) =>
                data.list.filter((conversation) => !conversation.isPinned),
        })
    )

    return (
        <Stack gap="xxs" className="group/recent-conversation-list">
            <Group
                gap="xxs"
                wrap="nowrap"
                className="group/recent-conversation-list-header"
            >
                <UnstyledButton
                    className="group/recent-conversation-list-toggle w-full"
                    aria-expanded={isExpanded}
                    aria-label={
                        isExpanded ? 'Collapse recents' : 'Expand recents'
                    }
                    onClick={toggle}
                >
                    <Group gap="xxs" px="xs">
                        <Text c="dimmed" size="sm">
                            Recents
                        </Text>
                        <ThemeIcon
                            variant="transparent"
                            c="dimmed"
                            size="sm"
                            className={cn(
                                isExpanded &&
                                    'invisible group-hover/recent-conversation-list:visible group-focus-visible/recent-conversation-list-toggle:visible'
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
                <Tooltip label="New chat">
                    <ActionIcon
                        variant="subtle"
                        c="dimmed"
                        color="gray"
                        size="sm"
                        radius="md"
                        aria-label="New chat"
                        className="invisible group-hover/recent-conversation-list-header:visible focus-visible:visible"
                        renderRoot={(props) => <Link to="/" {...props} />}
                    >
                        <PlusIcon className="size-4" />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Collapse expanded={isExpanded} keepMounted={false}>
                {isEmpty(conversations) ? (
                    <Text c="dimmed" size="sm" px="xs">
                        No conversations
                    </Text>
                ) : (
                    <Stack component="ul" gap="xxxs">
                        {conversations.map((conversation) => (
                            <ConversationListItem
                                conversation={conversation}
                                key={conversation.id}
                            />
                        ))}
                    </Stack>
                )}
            </Collapse>
        </Stack>
    )
}

export default RecentConversationList
