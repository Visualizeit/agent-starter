import {
    Archive02Icon,
    Edit02Icon,
    MoreHorizontalIcon,
    PinIcon,
    PinOffIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ActionIcon, Box, Menu, Text, UnstyledButton } from '@mantine/core'
import { modals } from '@mantine/modals'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { cn } from 'cnfast'
import { TextMorph } from 'torph/react'

import orpc from '@/lib/orpc'
import type { conversations } from '@/server/db/schema'

import { NEW_CHAT_LABEL } from './conversation-constants'
import RenameConversationForm from './rename-conversation-form'

interface ConversationListItemProps {
    conversation: typeof conversations.$inferSelect
    isNested?: boolean
}

const ConversationListItem = ({
    conversation,
    isNested = false,
}: ConversationListItemProps) => {
    const label = conversation.title ?? NEW_CHAT_LABEL

    const navigate = useNavigate()

    const { conversationId } = useParams({ strict: false })

    const archiveConversationMutation = useMutation(
        orpc.conversation.update.mutationOptions({
            onSuccess: async (
                _updatedConversation,
                _variables,
                _onMutateResult,
                context
            ) => {
                await Promise.all([
                    context.client.invalidateQueries(
                        orpc.conversation.list.queryOptions({
                            input: { status: 'active' },
                        })
                    ),
                    context.client.invalidateQueries(
                        orpc.project.list.queryOptions()
                    ),
                ])

                if (conversation.id === conversationId) {
                    await navigate({ to: '/' })
                }
            },
        })
    )

    const pinConversationMutation = useMutation(
        orpc.conversation.update.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await Promise.all([
                    context.client.invalidateQueries(
                        orpc.conversation.list.queryOptions({
                            input: { status: 'active' },
                        })
                    ),
                    context.client.invalidateQueries(
                        orpc.project.list.queryOptions()
                    ),
                ])
            },
        })
    )

    const handleArchive = async () => {
        await archiveConversationMutation.mutateAsync({
            id: conversation.id,
            status: 'archived',
        })
    }

    const handlePin = async () => {
        await pinConversationMutation.mutateAsync({
            id: conversation.id,
            isPinned: !conversation.isPinned,
        })
    }

    const handleRename = () => {
        modals.open({
            children: <RenameConversationForm conversation={conversation} />,
            title: 'Rename Conversation',
        })
    }

    return (
        <Box
            component="li"
            className={cn(
                'group/menu-item relative list-none',
                'rounded-(--mantine-radius-md)',
                'hover:bg-(--mantine-color-gray-light-hover) focus-within:bg-(--mantine-color-gray-light-hover)',
                'has-[[aria-haspopup=menu][aria-expanded=true]]:bg-(--mantine-color-gray-light-hover)'
            )}
        >
            <UnstyledButton
                className={cn(
                    'block w-full rounded-[inherit] px-(--mantine-spacing-xs) py-(--mantine-spacing-sidebar-menu-item-y)',
                    'aria-[current=page]:bg-(--mantine-color-gray-light-hover)',
                    'group-hover/menu-item:pr-[calc(var(--mantine-spacing-xs)+1.75rem)] group-focus-within/menu-item:pr-[calc(var(--mantine-spacing-xs)+1.75rem)] group-has-[[aria-haspopup=menu][aria-expanded=true]]/menu-item:pr-[calc(var(--mantine-spacing-xs)+1.75rem)]'
                )}
                renderRoot={(props) => (
                    <Link
                        to="/$conversationId"
                        params={{ conversationId: conversation.id }}
                        {...props}
                    >
                        <Text
                            className={cn(
                                'scroll-fade-e overflow-hidden whitespace-nowrap',
                                isNested &&
                                    'pl-[calc(var(--mantine-spacing-md)+var(--mantine-spacing-xs))]'
                            )}
                            size="sm"
                        >
                            <TextMorph>{label}</TextMorph>
                        </Text>
                    </Link>
                )}
            />
            <Menu position="bottom-start" shadow="md">
                <Menu.Target>
                    <ActionIcon
                        variant="subtle"
                        radius="sm"
                        color="gray"
                        size="sm"
                        aria-label="Conversation actions"
                        className={cn(
                            'invisible absolute right-(--mantine-spacing-xs) top-1/2 -translate-y-1/2',
                            'group-hover/menu-item:visible group-focus-within/menu-item:visible aria-expanded:visible'
                        )}
                    >
                        <HugeiconsIcon
                            icon={MoreHorizontalIcon}
                            className="size-4"
                        />
                    </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                    <Menu.Item
                        leftSection={
                            <HugeiconsIcon
                                icon={Edit02Icon}
                                className="size-4"
                            />
                        }
                        onClick={handleRename}
                    >
                        Rename
                    </Menu.Item>
                    <Menu.Item
                        disabled={pinConversationMutation.isPending}
                        leftSection={
                            conversation.isPinned ? (
                                <HugeiconsIcon
                                    icon={PinOffIcon}
                                    className="size-4"
                                />
                            ) : (
                                <HugeiconsIcon
                                    icon={PinIcon}
                                    className="size-4"
                                />
                            )
                        }
                        onClick={handlePin}
                    >
                        {conversation.isPinned ? 'Unpin' : 'Pin'}
                    </Menu.Item>
                    <Menu.Item
                        disabled={archiveConversationMutation.isPending}
                        leftSection={
                            <HugeiconsIcon
                                icon={Archive02Icon}
                                className="size-4"
                            />
                        }
                        onClick={handleArchive}
                    >
                        Archive
                    </Menu.Item>
                </Menu.Dropdown>
            </Menu>
        </Box>
    )
}

export default ConversationListItem
