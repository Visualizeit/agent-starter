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
import { useMutation, useSuspenseQuery } from '@tanstack/react-query'
import { cn } from 'cnfast'
import { ChevronRightIcon, PlusIcon } from 'lucide-react'

import orpc from '@/lib/orpc'

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
                gap="xxs"
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
                    <Group gap="xxs" px="xs">
                        <Text size="sm">Projects</Text>
                        <ThemeIcon
                            variant="transparent"
                            c="gray"
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
                        c="gray"
                        color="gray"
                        size="sm"
                        radius="md"
                        aria-label="Add project"
                        className="invisible group-hover/project-list-header:visible group-focus-within/project-list-header:visible"
                        loading={addProjectMutation.isPending}
                        onClick={handleAddProject}
                    >
                        <PlusIcon className="size-4" />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Collapse expanded={isExpanded} keepMounted={false}>
                <Stack component="ul" gap="xxxs">
                    {projects.map((project) => (
                        <ProjectListItem project={project} key={project.id} />
                    ))}
                </Stack>
            </Collapse>
        </Stack>
    )
}

export default ProjectList
