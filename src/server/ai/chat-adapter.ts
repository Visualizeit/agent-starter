import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'

import serverEnv from '@/server/server-env'

const chatAdapter = openaiCompatibleText(serverEnv.DEEPSEEK_MODEL, {
    apiKey: serverEnv.DEEPSEEK_API_KEY,
    baseURL: serverEnv.DEEPSEEK_BASE_URL,
    name: 'deepseek',
})

export default chatAdapter
