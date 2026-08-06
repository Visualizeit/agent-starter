import type { FlueConversationMessage, FlueConversationPart } from '@flue/react'
import { Box, Group } from '@mantine/core'
import { flatMap, last } from 'es-toolkit'
import { findLast } from 'es-toolkit/compat'
import { invariant } from 'es-toolkit/util'
import { match } from 'ts-pattern'

import AssistantMessageProcess from '@/components/flue/assistant-message-process'
import MessageCopyButton from '@/components/flue/message-copy-button'
import MessageResponse from '@/components/flue/message-response'
import AssistantMessageBody from '@/components/ui/assistant-message-body'
import { Message, MessageContent } from '@/components/ui/message'
import UserMessageBody from '@/components/ui/user-message-body'

interface ConversationMessageProps {
    group: ConversationMessageGroup
    isResponding: boolean
}

interface AssistantMessageBlockProps {
    isResponding: boolean
    messages: FlueConversationMessage[]
}

interface UserMessageBlockProps {
    messages: FlueConversationMessage[]
}

export interface ConversationMessageGroup {
    id: FlueConversationMessage['id']
    messages: FlueConversationMessage[]
    role: Exclude<FlueConversationMessage['role'], 'system'>
    submissionId: FlueConversationMessage['submissionId']
}

interface MessagePartEntry {
    key: string
    message: FlueConversationMessage
    part: FlueConversationPart
}

interface RenderableAssistantPartEntry extends MessagePartEntry {
    part: Extract<FlueConversationPart, { type: 'reasoning' | 'text' }>
}

interface TextMessagePartEntry extends MessagePartEntry {
    part: Extract<FlueConversationPart, { type: 'text' }>
}

const getTextPartEntriesCopyText = (entries: TextMessagePartEntry[]) =>
    entries.map(({ part }) => part.text).join('\n\n')

const getMessagePartEntries = (
    messages: FlueConversationMessage[]
): MessagePartEntry[] =>
    flatMap(messages, (message) =>
        message.parts.map((part, index) => ({
            key: `${message.id}:${index}`,
            message,
            part,
        }))
    )

const getTerminalAssistantMessage = (messages: FlueConversationMessage[]) =>
    findLast(messages, (message) =>
        message.parts.some(
            (part) => part.type === 'text' && part.text.trim().length > 0
        )
    ) ?? last(messages)

const isRenderableAssistantPartEntry = (
    entry: MessagePartEntry
): entry is RenderableAssistantPartEntry =>
    entry.part.type === 'reasoning' || entry.part.type === 'text'

const isTextMessagePartEntry = (
    entry: MessagePartEntry
): entry is TextMessagePartEntry => entry.part.type === 'text'

const UserMessageBlock = ({ messages }: UserMessageBlockProps) => {
    const textPartEntries = getMessagePartEntries(messages).filter(
        isTextMessagePartEntry
    )

    const copyText = getTextPartEntriesCopyText(textPartEntries)

    return (
        <Message align="end">
            <MessageContent>
                {textPartEntries.map(({ key, part }) => (
                    <UserMessageBody key={key}>
                        <MessageResponse
                            isStreaming={part.state === 'streaming'}
                            markdown={part.text}
                        />
                    </UserMessageBody>
                ))}
                {copyText.length > 0 && (
                    <Group
                        className="invisible group-hover/message:visible group-focus-within/message:visible"
                        justify="flex-end"
                    >
                        <MessageCopyButton value={copyText} />
                    </Group>
                )}
            </MessageContent>
        </Message>
    )
}

const AssistantMessageBlock = ({
    isResponding,
    messages,
}: AssistantMessageBlockProps) => {
    const messagePartEntries = getMessagePartEntries(messages)

    const terminalMessage = getTerminalAssistantMessage(messages)
    invariant(terminalMessage, 'Assistant message group is empty')

    const processPartEntries = messagePartEntries.filter(
        (entry): entry is RenderableAssistantPartEntry =>
            isRenderableAssistantPartEntry(entry) &&
            (entry.message.id !== terminalMessage.id ||
                entry.part.type !== 'text')
    )

    const answerPartEntries = messagePartEntries.filter(
        (entry): entry is TextMessagePartEntry =>
            isTextMessagePartEntry(entry) &&
            entry.message.id === terminalMessage.id
    )

    const copyText = getTextPartEntriesCopyText(answerPartEntries)

    return (
        <Message>
            <MessageContent>
                {processPartEntries.length > 0 && (
                    <AssistantMessageProcess isResponding={isResponding}>
                        {processPartEntries.map(({ key, part }) =>
                            match(part)
                                .with(
                                    { type: 'reasoning' },
                                    (reasoningPart) => (
                                        <Box
                                            className="text-muted-foreground text-sm"
                                            key={key}
                                        >
                                            <MessageResponse
                                                isStreaming={
                                                    reasoningPart.state ===
                                                    'streaming'
                                                }
                                                markdown={reasoningPart.text}
                                            />
                                        </Box>
                                    )
                                )
                                .with({ type: 'text' }, (textPart) => (
                                    <AssistantMessageBody key={key}>
                                        <MessageResponse
                                            isStreaming={
                                                textPart.state === 'streaming'
                                            }
                                            markdown={textPart.text}
                                        />
                                    </AssistantMessageBody>
                                ))
                                .exhaustive()
                        )}
                    </AssistantMessageProcess>
                )}
                {answerPartEntries.map(({ key, part }) => (
                    <AssistantMessageBody key={key}>
                        <MessageResponse
                            isStreaming={part.state === 'streaming'}
                            markdown={part.text}
                        />
                    </AssistantMessageBody>
                ))}
                {!isResponding && copyText.length > 0 && (
                    <Group
                        className="invisible group-hover/message:visible group-focus-within/message:visible"
                        justify="flex-start"
                    >
                        <MessageCopyButton value={copyText} />
                    </Group>
                )}
            </MessageContent>
        </Message>
    )
}

const ConversationMessage = ({
    group,
    isResponding,
}: ConversationMessageProps) =>
    group.role === 'user' ? (
        <UserMessageBlock messages={group.messages} />
    ) : (
        <AssistantMessageBlock
            isResponding={isResponding}
            messages={group.messages}
        />
    )

export default ConversationMessage
