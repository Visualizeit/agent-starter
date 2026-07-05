import type { FlueConversationMessage } from '@flue/react'
import { match } from 'ts-pattern'

import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import MessageResponse from '@/components/flue/message-response'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Message, MessageContent } from '@/components/ui/message'

interface ConversationMessageProps {
    message: FlueConversationMessage
}

const ConversationMessage = ({ message }: ConversationMessageProps) => {
    const align = message.role === 'user' ? 'end' : 'start'

    const bubbleVariant = message.role === 'user' ? 'muted' : 'ghost'

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
            </MessageContent>
        </Message>
    )
}

export default ConversationMessage
