import { Button, Group, Stack, TextInput } from '@mantine/core'
import { useForm, schemaResolver } from '@mantine/form'
import { closeAllModals } from '@mantine/modals'
import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import orpc from '@/lib/orpc'
import type { conversations } from '@/server/db/schema'

import { NEW_CHAT_LABEL } from './conversation-constants'

const schema = z.object({
    title: z.string().max(200),
})

interface RenameConversationFormProps {
    conversation: typeof conversations.$inferSelect
}

const RenameConversationForm = ({
    conversation,
}: RenameConversationFormProps) => {
    const router = useRouter()

    const form = useForm({
        initialValues: {
            title: conversation.title ?? NEW_CHAT_LABEL,
        },
        validate: schemaResolver(schema),
    })

    const renameMutation = useMutation(
        orpc.conversation.update.mutationOptions({
            onSuccess: async (_data, _variables, _onMutateResult, context) => {
                await Promise.all([
                    context.client.invalidateQueries(
                        orpc.conversation.find.queryOptions({
                            input: { id: conversation.id },
                        })
                    ),
                    context.client.invalidateQueries(
                        orpc.conversation.list.queryOptions({
                            input: { status: 'active' },
                        })
                    ),
                ])

                await router.invalidate()

                closeAllModals()
            },
        })
    )

    const handleSubmit = form.onSubmit(async (values) => {
        await renameMutation.mutateAsync({
            id: conversation.id,
            title: values.title,
        })
    })

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    data-autofocus
                    required
                    label="Title"
                    placeholder="Enter conversation title"
                    {...form.getInputProps('title')}
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

export default RenameConversationForm
