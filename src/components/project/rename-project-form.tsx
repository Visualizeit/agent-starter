import { Button, Group, Stack, TextInput } from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { closeAllModals } from '@mantine/modals'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

import orpc from '@/lib/orpc'
import type { projects } from '@/server/db/schema'

const schema = z.object({
    name: z.string().trim().min(1).max(200),
})

interface RenameProjectFormProps {
    project: typeof projects.$inferSelect
}

const RenameProjectForm = ({ project }: RenameProjectFormProps) => {
    const form = useForm({
        initialValues: {
            name: project.name,
        },
        validate: schemaResolver(schema),
    })

    const renameMutation = useMutation(
        orpc.project.update.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await context.client.invalidateQueries(
                    orpc.project.list.queryOptions({
                        input: { status: 'active' },
                    })
                )

                closeAllModals()
            },
        })
    )

    const handleSubmit = form.onSubmit(async (values) => {
        await renameMutation.mutateAsync({
            id: project.id,
            name: values.name,
        })
    })

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    data-autofocus
                    placeholder="Enter project name"
                    {...form.getInputProps('name')}
                />
                <Group justify="flex-end" gap="xs">
                    <Button variant="default" onClick={() => closeAllModals()}>
                        Cancel
                    </Button>
                    <Button type="submit" loading={renameMutation.isPending}>
                        Save
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}

export default RenameProjectForm
