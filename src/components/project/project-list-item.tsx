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
import { Link, useParams } from '@tanstack/react-router'
import { isEmpty } from 'es-toolkit/compat'
import {
    FolderIcon,
    FolderOpenIcon,
    MoreHorizontalIcon,
    PencilLineIcon,
    PlusIcon,
    XIcon,
} from 'lucide-react'

import ConversationListItem from '@/components/conversation/conversation-list-item'
import orpc from '@/lib/orpc'
import type { ORPCOutputs } from '@/lib/orpc'
import { cn } from '@/lib/utils'

import RenameProjectForm from './rename-project-form'

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
}: ProjectConversationListProps) => {
    if (isEmpty(conversations)) {
        return (
            <Text c="dimmed" size="sm" px="xxs">
                No conversations
            </Text>
        )
    }

    return (
        <Box component="ul" pl="md">
            {conversations.map((conversation) => (
                <ConversationListItem
                    conversation={conversation}
                    key={conversation.id}
                />
            ))}
        </Box>
    )
}

const ProjectListItem = ({ project }: ProjectListItemProps) => {
    const { conversationId } = useParams({ strict: false })
    const isCurrentProjectConversation = project.conversations.some(
        (conversation) => conversation.id === conversationId
    )
    const [isExpanded, { open, toggle }] = useDisclosure(
        isCurrentProjectConversation
    )

    const removeProjectMutation = useMutation(
        orpc.project.remove.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await context.client.invalidateQueries(
                    orpc.project.list.queryOptions({
                        input: { status: 'active' },
                    })
                )
            },
        })
    )

    const handleRename = () => {
        modals.open({
            children: <RenameProjectForm project={project} />,
            title: 'Rename Project',
        })
    }

    const handleRemove = () => {
        modals.openConfirmModal({
            children: (
                <Text size="sm">
                    Remove {project.name} from the project list? This will not
                    delete the local folder.
                </Text>
            ),
            confirmProps: { color: 'red' },
            labels: { cancel: 'Cancel', confirm: 'Remove' },
            onConfirm: async () => {
                await removeProjectMutation.mutateAsync({ id: project.id })
            },
            title: 'Remove Project',
        })
    }

    return (
        <Stack component="li" gap="xxxs">
            <Box
                className={cn(
                    'group/project-menu-item relative overflow-hidden rounded-(--mantine-radius-md)',
                    'hover:bg-(--mantine-color-gray-light-hover)',
                    'has-[[aria-haspopup=menu][aria-expanded=true]]:bg-(--mantine-color-gray-light-hover)'
                )}
            >
                <UnstyledButton
                    className="w-full group-hover/project-menu-item:pr-14 group-focus-within/project-menu-item:pr-14"
                    aria-expanded={isExpanded}
                    aria-label={
                        isExpanded
                            ? `Collapse ${project.name}`
                            : `Expand ${project.name}`
                    }
                    onClick={toggle}
                >
                    <Group gap="xs" wrap="nowrap" p="xxs">
                        {isExpanded ? (
                            <FolderOpenIcon className="size-4 shrink-0 text-(--mantine-color-dimmed)" />
                        ) : (
                            <FolderIcon className="size-4 shrink-0 text-(--mantine-color-dimmed)" />
                        )}
                        <Text className="min-w-0" size="sm" truncate>
                            {project.name}
                        </Text>
                    </Group>
                </UnstyledButton>
                <Group
                    gap="xxxs"
                    wrap="nowrap"
                    className={cn(
                        'invisible absolute right-(--mantine-spacing-xxs) top-1/2 -translate-y-1/2',
                        'group-hover/project-menu-item:visible group-focus-within/project-menu-item:visible has-aria-expanded:visible'
                    )}
                >
                    <Menu position="bottom-start">
                        <Menu.Target>
                            <ActionIcon
                                variant="subtle"
                                radius="sm"
                                color="gray"
                                size="sm"
                                aria-label="Project actions"
                            >
                                <MoreHorizontalIcon className="size-4" />
                            </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item
                                leftSection={
                                    <PencilLineIcon className="size-4" />
                                }
                                onClick={handleRename}
                            >
                                Rename
                            </Menu.Item>
                            <Menu.Item
                                disabled={removeProjectMutation.isPending}
                                leftSection={<XIcon className="size-4" />}
                                onClick={handleRemove}
                            >
                                Remove
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
                                to="/"
                                search={{ projectId: project.id }}
                                {...props}
                            />
                        )}
                    >
                        <PlusIcon className="size-4" />
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
