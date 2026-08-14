import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'

import serverEnv from '@/server/server-env'

const createChatAdapter = () =>
    openaiCompatibleText(serverEnv.DEEPSEEK_MODEL, {
        apiKey: serverEnv.DEEPSEEK_API_KEY,
        baseURL: serverEnv.DEEPSEEK_BASE_URL,
        name: 'deepseek',
    })

export default createChatAdapter
