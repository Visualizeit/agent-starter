import {
    ActionIcon,
    Collapse,
    Group,
    Stack,
    ThemeIcon,
    Tooltip,
    UnstyledButton,
    Text,
    Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'
import { cn } from 'cnfast'
import { isEmpty } from 'es-toolkit/compat'
import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import { useEffect } from 'react'

import orpc from '@/lib/orpc'

import ProjectForm from './project-form'
import ProjectListItem from './project-list-item'

const handleAddProject = () => {
    modals.open({
        children: <ProjectForm />,
        title: 'Create project',
    })
}

const ProjectList = () => {
    const { data: projects } = useSuspenseQuery(
        orpc.project.list.queryOptions({
            select: (data) => data.list,
        })
    )
    const projectId = useSearch({
        select: (search) => search.projectId,
        strict: false,
    })
    const [isExpanded, { open, toggle }] = useDisclosure(!isEmpty(projects))

    useEffect(() => {
        if (projectId) {
            open()
        }
    }, [open, projectId])

    return (
        <Stack gap="xxs" className="group/project-list">
            <Group
                gap="xxs"
                wrap="nowrap"
                className="group/project-list-header"
            >
                <UnstyledButton
                    className="group/project-list-toggle w-full"
                    aria-expanded={isExpanded}
                    aria-label={
                        isExpanded ? 'Collapse projects' : 'Expand projects'
                    }
                    onClick={toggle}
                >
                    <Group gap="xxs" px="xs">
                        <Title order={6} c="dimmed">
                            Projects
                        </Title>
                        <ThemeIcon
                            variant="transparent"
                            c="dimmed"
                            size="sm"
                            className={cn(
                                isExpanded &&
                                    'invisible group-hover/project-list:visible group-focus-visible/project-list-toggle:visible'
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
                        c="dimmed"
                        color="gray"
                        size="sm"
                        radius="md"
                        aria-label="Add project"
                        className="invisible group-hover/project-list-header:visible focus-visible:visible"
                        onClick={handleAddProject}
                    >
                        <PlusIcon className="size-4" />
                    </ActionIcon>
                </Tooltip>
            </Group>
            <Collapse expanded={isExpanded} keepMounted={false}>
                {isEmpty(projects) ? (
                    <Text c="dimmed" size="sm" py="xxs" className="text-center">
                        No projects
                    </Text>
                ) : (
                    <Stack component="ul" gap="xxxs">
                        {projects.map((project) => (
                            <ProjectListItem
                                project={project}
                                key={project.id}
                            />
                        ))}
                    </Stack>
                )}
            </Collapse>
        </Stack>
    )
}

export default ProjectList
