import {
    PlusSignIcon,
    Delete02Icon,
    Edit02Icon,
    Folder01Icon,
    Folder02Icon,
    MoreHorizontalIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import {
    ActionIcon,
    Box,
    Collapse,
    Group,
    Menu,
    Stack,
    Text,
    UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { cn } from 'cnfast'
import { isEmpty } from 'es-toolkit/compat'
import { TextMorph } from 'torph/react'

import ConversationListItem from '@/components/conversation/conversation-list-item'
import orpc from '@/lib/orpc'
import type { ORPCOutputs } from '@/lib/orpc'

import ProjectForm from './project-form'

type Project = ORPCOutputs['project']['list']['list'][number]
type ProjectConversations = Project['conversations']

interface ProjectListItemProps {
    project: Project
}

interface ProjectConversationListProps {
    conversations: ProjectConversations
}

const ProjectConversationList = ({
    conversations,
}: ProjectConversationListProps) => (
    <Box>
        {isEmpty(conversations) ? (
            <Text c="dimmed" size="sm" py="xxs" className="text-center">
                No conversations
            </Text>
        ) : (
            <Stack component="ul" gap="xxxs">
                {conversations.map((conversation) => (
                    <ConversationListItem
                        conversation={conversation}
                        isNested
                        key={conversation.id}
                    />
                ))}
            </Stack>
        )}
    </Box>
)

const ProjectListItem = ({ project }: ProjectListItemProps) => {
    const navigate = useNavigate()
    const { conversationId } = useParams({ strict: false })
    const isCurrentProjectConversation = project.conversations.some(
        (conversation) => conversation.id === conversationId
    )
    const [isExpanded, { open, toggle }] = useDisclosure(
        isCurrentProjectConversation
    )

    const deleteProjectMutation = useMutation(
        orpc.project.delete.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await context.client.invalidateQueries(
                    orpc.project.list.queryOptions()
                )
            },
        })
    )

    const handleEdit = () => {
        modals.open({
            children: <ProjectForm project={project} />,
            title: 'Edit project',
        })
    }

    const handleDelete = () => {
        modals.openConfirmModal({
            children: (
                <Text size="sm">
                    Delete {project.name} and all its conversations? This cannot
                    be undone.
                </Text>
            ),
            confirmProps: { color: 'red' },
            labels: { cancel: 'Cancel', confirm: 'Delete' },
            onConfirm: async () => {
                await deleteProjectMutation.mutateAsync({ id: project.id })

                if (isCurrentProjectConversation) {
                    await navigate({ to: '/' })
                }
            },
            title: 'Delete project',
        })
    }

    return (
        <Stack component="li" gap="xxs">
            <Box
                className={cn(
                    'group/project-menu-item relative rounded-(--mantine-radius-md)',
                    'hover:bg-(--mantine-color-gray-light-hover)',
                    'has-[[aria-haspopup=menu][aria-expanded=true]]:bg-(--mantine-color-gray-light-hover)'
                )}
            >
                <UnstyledButton
                    className={cn(
                        'w-full rounded-[inherit] px-(--mantine-spacing-xs) py-(--mantine-spacing-sidebar-menu-item-y)',
                        'group-hover/project-menu-item:pr-14 group-focus-within/project-menu-item:pr-14'
                    )}
                    aria-expanded={isExpanded}
                    aria-label={
                        isExpanded
                            ? `Collapse ${project.name}`
                            : `Expand ${project.name}`
                    }
                    onClick={toggle}
                >
                    <Group gap="xs" wrap="nowrap">
                        {isExpanded ? (
                            <HugeiconsIcon
                                icon={Folder02Icon}
                                className="size-4 shrink-0 text-(--mantine-color-dimmed)"
                            />
                        ) : (
                            <HugeiconsIcon
                                icon={Folder01Icon}
                                className="size-4 shrink-0 text-(--mantine-color-dimmed)"
                            />
                        )}
                        <Text
                            className="scroll-fade-e min-w-0 overflow-hidden whitespace-nowrap"
                            size="sm"
                        >
                            <TextMorph>{project.name}</TextMorph>
                        </Text>
                    </Group>
                </UnstyledButton>
                <Group
                    gap="xxs"
                    wrap="nowrap"
                    className={cn(
                        'invisible absolute right-(--mantine-spacing-xs) top-1/2 -translate-y-1/2',
                        'group-hover/project-menu-item:visible group-focus-within/project-menu-item:visible has-aria-expanded:visible'
                    )}
                >
                    <Menu position="bottom-start" shadow="md">
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                radius="sm"
                                color="gray"
                                size="sm"
                                aria-label="Project actions"
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
                                onClick={handleEdit}
                            >
                                Edit
                            </Menu.Item>
                            <Menu.Item
                                color="red"
                                disabled={deleteProjectMutation.isPending}
                                leftSection={
                                    <HugeiconsIcon
                                        icon={Delete02Icon}
                                        className="size-4"
                                    />
                                }
                                onClick={handleDelete}
                            >
                                Delete
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                    <ActionIcon
                        variant="subtle"
                        radius="sm"
                        color="gray"
                        size="sm"
                        aria-label={`New chat in ${project.name}`}
                        onClick={open}
                        renderRoot={(props) => (
                            <Link
                                search={{ projectId: project.id }}
                                to="/"
                                {...props}
                            />
                        )}
                    >
                        <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
                    </ActionIcon>
                </Group>
            </Box>
            <Collapse expanded={isExpanded} keepMounted={false}>
                <ProjectConversationList
                    conversations={project.conversations}
                />
            </Collapse>
        </Stack>
    )
}

export default ProjectListItem
