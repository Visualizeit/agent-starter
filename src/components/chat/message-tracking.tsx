import type { UIMessage } from '@tanstack/ai-react'

import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
    useMessageScroller,
    useMessageScrollerVisibility,
} from '@/components/ui/message-scroller'

interface MessageTrackingProps {
    messages: readonly UIMessage[]
}

type MessagePart = UIMessage['parts'][number]
type TextMessagePart = Extract<MessagePart, { type: 'text' }>

const isTextPart = (part: MessagePart): part is TextMessagePart =>
    part.type === 'text'

const getMessageText = (message: UIMessage) =>
    message.parts
        .filter(isTextPart)
        .map((part) => part.content)
        .join('\n')

const getTrimmedMessageText = (message: UIMessage) => {
    const text = getMessageText(message)

    return text.length > 42 ? `${text.slice(0, 39)}...` : text
}

const MessageTracking = ({ messages }: MessageTrackingProps) => {
    const { scrollToMessage } = useMessageScroller()
    const { currentAnchorId } = useMessageScrollerVisibility()

    if (messages.length === 0) {
        return null
    }

    return (
        <HoverCard>
            <HoverCardTrigger
                render={
                    <button
                        type="button"
                        aria-label="Open transcript outline"
                        className="flex h-9 w-9 flex-col items-center justify-center gap-1 rounded-md transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                }
            >
                {messages.map((message) => (
                    <span
                        key={message.id}
                        data-current={message.id === currentAnchorId}
                        className="h-0.5 w-4 rounded-full bg-muted-foreground/40 data-[current=true]:bg-foreground"
                    />
                ))}
            </HoverCardTrigger>
            <HoverCardContent
                align="center"
                side="right"
                sideOffset={-28}
                className="flex w-64 flex-col gap-1 rounded-2xl p-1"
            >
                {messages.map((message) => (
                    <button
                        key={message.id}
                        type="button"
                        aria-current={
                            currentAnchorId === message.id
                                ? 'location'
                                : undefined
                        }
                        className="flex min-h-7 items-center rounded-xl px-2 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-current:bg-accent aria-current:text-accent-foreground"
                        onClick={() =>
                            scrollToMessage(message.id, {
                                align: 'start',
                                behavior: 'smooth',
                            })
                        }
                    >
                        <span className="line-clamp-1 min-w-0">
                            {getTrimmedMessageText(message)}
                        </span>
                    </button>
                ))}
            </HoverCardContent>
        </HoverCard>
    )
}

export default MessageTracking
