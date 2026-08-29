import { Button, Group, Stack, Textarea, TextInput } from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { closeAllModals } from '@mantine/modals'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { isNotNil } from 'es-toolkit/predicate'

import orpc from '@/lib/orpc'
import { projectFormSchema } from '@/schemas/project-form-schema'
import type { projects } from '@/server/db/schema'

interface ProjectFormProps {
    project?: typeof projects.$inferSelect
}

const ProjectForm = ({ project }: ProjectFormProps) => {
    const isEditing = isNotNil(project)

    const navigate = useNavigate()

    const form = useForm({
        initialValues: {
            instructions: isEditing ? project.instructions : '',
            name: isEditing ? project.name : '',
        },
        validate: schemaResolver(projectFormSchema),
    })

    const addMutation = useMutation(
        orpc.project.add.mutationOptions({
            onSuccess: async (
                createdProject,
                _variables,
                _onMutateResult,
                context
            ) => {
                await context.client.invalidateQueries(
                    orpc.project.list.queryOptions()
                )

                closeAllModals()

                await navigate({
                    search: { projectId: createdProject.id },
                    to: '/',
                })
            },
        })
    )
    const updateMutation = useMutation(
        orpc.project.update.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await context.client.invalidateQueries(
                    orpc.project.list.queryOptions()
                )

                closeAllModals()
            },
        })
    )

    const handleSubmit = form.onSubmit(async (values) => {
        if (isEditing) {
            await updateMutation.mutateAsync({
                id: project.id,
                ...values,
            })

            return
        }

        await addMutation.mutateAsync(values)
    })

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    data-autofocus
                    label="Name"
                    placeholder="Enter project name"
                    required
                    {...form.getInputProps('name')}
                />
                <Textarea
                    autosize
                    label="Instructions"
                    maxLength={20_000}
                    minRows={5}
                    placeholder="Add instructions for every conversation in this project"
                    {...form.getInputProps('instructions')}
                />
                <Group justify="flex-end" gap="xs">
                    <Button
                        variant="default"
                        onClick={() => {
                            closeAllModals()
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        loading={
                            addMutation.isPending || updateMutation.isPending
                        }
                    >
                        {isEditing ? 'Save' : 'Create'}
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}

export default ProjectForm
