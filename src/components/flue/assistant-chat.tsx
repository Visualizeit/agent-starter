import { useFlueAgent } from '@flue/react'
import type { UIMessagePart } from '@flue/react'
import {
    Alert,
    Button,
    Group,
    Paper,
    Stack,
    Text,
    Textarea,
} from '@mantine/core'
import { Send } from 'lucide-react'
import { useState } from 'react'
import type {  SubmitEventHandler } from 'react'

const getMessageText = (parts: UIMessagePart[]) =>
    parts
        .filter((part) => part.type === 'text' || part.type === 'reasoning')
        .map((part) => part.text)
        .join('\n')

const AssistantChat = () => {
    const [message, setMessage] = useState('')

    const agent = useFlueAgent({
        history: 'all',
        id: 'default',
        name: 'assistant',
    })



    const handleSubmit: SubmitEventHandler = async (event) => {
        event.preventDefault()

        const trimmedMessage = message.trim()

        if (!trimmedMessage) {
            return
        }

        setMessage('')
        await agent.sendMessage(trimmedMessage)
    }

    return (
        <Stack>
            {agent.error ? (
                <Alert color="red">{agent.error.message}</Alert>
            ) : null}

            <Stack gap="sm">
                {agent.messages.map((agentMessage) => (
                    <Paper key={agentMessage.id} withBorder p="md">
                        <Text fw={600}>{agentMessage.role}</Text>
                        <Text style={{ whiteSpace: 'pre-wrap' }}>
                            {getMessageText(agentMessage.parts)}
                        </Text>
                    </Paper>
                ))}
            </Stack>

            <form onSubmit={handleSubmit}>
                <Stack>
                    <Textarea
                        autosize
                        minRows={3}
                        onChange={(event) =>
                            setMessage(event.currentTarget.value)
                        }
                        placeholder="Ask the assistant"
                        value={message}
                    />
                    <Group justify="flex-end">
                        <Button
                            disabled={
                                !message.trim() || agent.status === 'submitted'
                            }
                            leftSection={<Send size={16} />}
                            type="submit"
                        >
                            Send
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Stack>
    )
}

export default AssistantChat
