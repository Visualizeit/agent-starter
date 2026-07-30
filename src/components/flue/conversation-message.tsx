import type { FlueConversationMessage } from '@flue/react'
import { flatMap } from 'es-toolkit'
import { match } from 'ts-pattern'

import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import MessageCopyButton from '@/components/flue/message-copy-button'
import MessageResponse from '@/components/flue/message-response'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'

interface ConversationMessageProps {
    message: FlueConversationMessage
}

const getMessageCopyText = (message: FlueConversationMessage) =>
    flatMap(message.parts, (part) =>
        match(part)
            .with({ type: 'text' }, (textPart) => [textPart.text])
            .otherwise(() => [])
    ).join('\n\n')

const ConversationMessage = ({ message }: ConversationMessageProps) => {
    const align = message.role === 'user' ? 'end' : 'start'

    const bubbleVariant = message.role === 'user' ? 'muted' : 'ghost'

    const copyText = getMessageCopyText(message)

    return (
        <Message align={align}>
            <MessageContent>
                {message.parts.map((part, index) =>
                    match(part)
                        .with({ type: 'reasoning' }, (reasoningPart) => (
                            <Bubble align={align} key={index} variant="ghost">
                                <BubbleContent>
                                    <Reasoning
                                        defaultOpen={false}
                                        isStreaming={
                                            reasoningPart.state === 'streaming'
                                        }
                                    >
                                        <ReasoningTrigger />
                                        <ReasoningContent>
                                            {reasoningPart.text}
                                        </ReasoningContent>
                                    </Reasoning>
                                </BubbleContent>
                            </Bubble>
                        ))
                        .with({ type: 'text' }, (textPart) => (
                            <Bubble
                                align={align}
                                key={index}
                                variant={bubbleVariant}
                            >
                                <BubbleContent>
                                    <MessageResponse
                                        isStreaming={
                                            textPart.state === 'streaming'
                                        }
                                        markdown={textPart.text}
                                    />
                                </BubbleContent>
                            </Bubble>
                        ))
                        .otherwise(() => null)
                )}
                <MessageFooter>
                    <MessageCopyButton value={copyText} />
                </MessageFooter>
            </MessageContent>
        </Message>
    )
}

export default ConversationMessage
