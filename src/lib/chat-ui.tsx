import { createChatUI } from '@tanstack/ai-react/ui'

import ChatLayout from '@/components/chat/chat-layout'
import ConversationMessage from '@/components/chat/conversation-message'
import PromptInput from '@/components/chat/prompt-input'
import TextMessagePart from '@/components/chat/text-message-part'
import ThinkingMessagePart from '@/components/chat/thinking-message-part'
import chatOptions from '@/lib/chat-options'
import chatUiContext from '@/lib/chat-ui-context'

const chatUi = createChatUI(chatOptions, {
    components: {
        input: PromptInput,
        layout: ChatLayout,
        message: ConversationMessage,
    },
    context: chatUiContext,
    partsComponents: {
        fallback: () => null,
        text: TextMessagePart,
        thinking: ThinkingMessagePart,
    },
})

export default chatUi
