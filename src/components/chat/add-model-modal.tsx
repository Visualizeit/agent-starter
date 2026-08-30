import {
    Button,
    Group,
    PasswordInput,
    Select,
    Stack,
    TextInput,
} from '@mantine/core'
import { schemaResolver, useForm } from '@mantine/form'
import { closeAllModals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { useMutation } from '@tanstack/react-query'
import { customAlphabet } from 'nanoid'

import STATUS_COLORS from '@/configs/status-colors'
import byok from '@/lib/byok'
import { modelRegistrationSchema } from '@/schemas/model-config-schema'
import type { ModelRegistration } from '@/schemas/model-config-schema'
import useModelStore from '@/stores/model-store'

const protocolOptions = [
    { label: 'OpenAI-compatible', value: 'openai' },
    { label: 'Anthropic', value: 'anthropic' },
    { label: 'Gemini', value: 'gemini' },
]

const createCredentialSuffix = customAlphabet(
    'abcdefghijklmnopqrstuvwxyz0123456789-',
    20
)

// BYOK provider IDs must start with a lowercase letter.
const createCredentialId = () => `m${createCredentialSuffix()}`

const AddModelModal = () => {
    const addModel = useModelStore((state) => state.addModel)

    const form = useForm<ModelRegistration>({
        initialValues: {
            apiKey: '',
            baseUrl: '',
            displayName: '',
            model: '',
            protocol: 'openai',
        },
        validate: schemaResolver(modelRegistrationSchema),
    })

    let baseUrlPlaceholder = 'https://api.example.com/v1'

    if (form.values.protocol === 'anthropic') {
        baseUrlPlaceholder = 'https://api.anthropic.com'
    }

    if (form.values.protocol === 'gemini') {
        baseUrlPlaceholder = 'https://generativelanguage.googleapis.com'
    }

    const addModelMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const credentialId = createCredentialId()

            await byok.update(credentialId, values.apiKey)

            return { credentialId, values }
        },
        onError: (error) => {
            notifications.show({
                color: STATUS_COLORS.DANGER,
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to save the model',
                title: 'Unable to add model',
            })
        },
        onSuccess: ({ credentialId, values }) => {
            addModel({
                baseUrl: values.baseUrl.trim().replace(/\/$/u, ''),
                credentialId,
                displayName: values.displayName.trim() || values.model.trim(),
                model: values.model.trim(),
                protocol: values.protocol,
            })

            form.reset()
            closeAllModals()
        },
    })

    const handleClose = () => {
        if (addModelMutation.isPending) {
            return
        }

        form.reset()
        closeAllModals()
    }

    const handleSubmit = form.onSubmit((values) => {
        addModelMutation.mutate(values)
    })

    return (
        <form onSubmit={handleSubmit}>
            <Stack>
                <TextInput
                    label="Name"
                    placeholder="Optional display name"
                    {...form.getInputProps('displayName')}
                />
                <Select
                    allowDeselect={false}
                    data={protocolOptions}
                    label="Protocol"
                    {...form.getInputProps('protocol')}
                />
                <TextInput
                    label="Base URL"
                    placeholder={baseUrlPlaceholder}
                    required
                    type="url"
                    {...form.getInputProps('baseUrl')}
                />
                <TextInput
                    label="Model ID"
                    placeholder="Model identifier"
                    required
                    {...form.getInputProps('model')}
                />
                <PasswordInput
                    description="Used to connect to this model."
                    label="API key"
                    required
                    {...form.getInputProps('apiKey')}
                />
                <Group gap="xs" justify="flex-end">
                    <Button
                        disabled={addModelMutation.isPending}
                        onClick={handleClose}
                        variant="default"
                    >
                        Cancel
                    </Button>
                    <Button loading={addModelMutation.isPending} type="submit">
                        Add
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}

export default AddModelModal
