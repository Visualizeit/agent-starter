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
import { cn } from 'cn'
import { TextMorph } from 'torph/react'

import orpc from '@/lib/orpc'
import type { conversations } from '@/server/db/schema'

import { NEW_CHAT_LABEL } from './conversation-constants'
import RenameConversationForm from './rename-conversation-form'

import sidebarListItemClasses from '@/components/layout/sidebar-list-item-actions.module.css'

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

    const handleArchive = () => {
        archiveConversationMutation.mutate({
            id: conversation.id,
            status: 'archived',
        })
    }

    const handlePin = () => {
        pinConversationMutation.mutate({
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
                sidebarListItemClasses.root,
                'group/menu-item list-none',
                'rounded-(--mantine-radius-md)',
                'hover:bg-(--mantine-color-gray-light-hover) has-focus-visible:bg-(--mantine-color-gray-light-hover)',
                'has-[[aria-haspopup=menu][aria-expanded=true]]:bg-(--mantine-color-gray-light-hover)',
                'has-[[aria-current=page]]:bg-(--mantine-color-gray-light-hover)'
            )}
        >
            <UnstyledButton
                className="block w-full rounded-[inherit] px-(--mantine-spacing-xs) py-(--mantine-spacing-sidebar-menu-item-y)"
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
            <Box className={sidebarListItemClasses.actions}>
                <Menu position="bottom-start" shadow="md">
                    <Menu.Target>
                        <ActionIcon
                            variant="subtle"
                            radius="sm"
                            color="gray"
                            size="sm"
                            aria-label="Conversation actions"
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
        </Box>
    )
}

export default ConversationListItem
