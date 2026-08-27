import { Box, Stack } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import NewConversationPromptInput from '@/components/chat/new-conversation-prompt-input'

const searchSchema = z.object({
    projectId: z.string().optional(),
})

const Component = () => (
    <Stack className="absolute size-full" gap={0}>
        <Box className="flex-1 overflow-hidden" />
        <Box className="container mx-auto max-w-3xl px-(--mantine-spacing-md) pb-(--mantine-spacing-md)">
            <NewConversationPromptInput />
        </Box>
    </Stack>
)

export const Route = createFileRoute('/')({
    component: Component,
    validateSearch: searchSchema,
})
