import {
    ActionIcon,
    Box,
    Collapse,
    Group,
    Stack,
    ThemeIcon,
    Title,
    Tooltip,
    UnstyledButton,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { ChevronRightIcon, FolderPlusIcon } from 'lucide-react'

import orpc from '@/lib/orpc'
import { cn } from '@/lib/utils'

import ProjectListItem from './project-list-item'

const ProjectList = () => {
    const [isExpanded, { toggle }] = useDisclosure(true)

    const { data: projects } = useSuspenseQuery(
        orpc.project.list.queryOptions({
            input: { status: 'active' },
            select: (data) => data.list,
        })
    )

    const addProjectMutation = useMutation({
        mutationFn: () => orpc.project.add.call(),
        onSuccess: async (result, _variables, _onMutateResult, context) => {
            if (result.status === 'cancelled') {
                return
            }

            await context.client.invalidateQueries(
                orpc.project.list.queryOptions({
                    input: { status: 'active' },
                })
            )
        },
    })

    const handleAddProject = async () => {
        await addProjectMutation.mutateAsync()
    }

    return (
        <Stack gap="xxs" className="group/project-list">
            <Group
                gap="xxxs"
                wrap="nowrap"
                className="group/project-list-header"
            >
                <UnstyledButton
                    className="w-full"
                    aria-expanded={isExpanded}
                    aria-label={
                        isExpanded ? 'Collapse projects' : 'Expand projects'
                    }
                    onClick={toggle}
                >
                    <Group gap="xxxs" px="xxs">
                        <Title order={6} c="dimmed">
                            Projects
                        </Title>
                        <ThemeIcon
                            variant="transparent"
                            c="dimmed"
                            size="sm"
                            className={cn(
                                isExpanded &&
                                    'invisible group-hover/project-list:visible group-focus-within/project-list:visible'
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
                <Tooltip label="Add project">
                    <ActionIcon
                        variant="subtle"
                        color="gray"
                        size="sm"
                        radius="md"
                        aria-label="Add project"
                        className="invisible group-hover/project-list-header:visible group-focus-within/project-list-header:visible"
                        loading={addProjectMutation.isPending}
                        onClick={handleAddProject}
                    >
                        <FolderPlusIcon className="size-4" />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Collapse expanded={isExpanded} keepMounted={false}>
                <Box component="ul">
                    {projects.map((project) => (
                        <ProjectListItem project={project} key={project.id} />
                    ))}
                </Box>
            </Collapse>
        </Stack>
    )
}

export default ProjectList
