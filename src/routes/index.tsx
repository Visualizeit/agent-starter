import { Container } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'

import AssistantChat from '@/components/flue/assistant-chat'

const Component = () => (
    <Container>
        <AssistantChat />
    </Container>
)

export const Route = createFileRoute('/')({
    component: Component,
})
