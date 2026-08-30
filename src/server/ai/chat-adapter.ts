import type { AnyTextAdapter } from '@tanstack/ai'
import type { ANTHROPIC_MODELS } from '@tanstack/ai-anthropic'
import { createAnthropicChat } from '@tanstack/ai-anthropic'
import type { GEMINI_MODELS } from '@tanstack/ai-gemini'
import { createGeminiChat } from '@tanstack/ai-gemini'
import { openaiCompatibleText } from '@tanstack/ai-openai/compatible'
import { byokMissing, getByokKey } from '@tanstack/ai/byok/server'

import { modelConfigurationSchema } from '@/schemas/model-config-schema'
import type { ModelProtocol } from '@/schemas/model-config-schema'

interface AdapterFactoryInput {
    apiKey: string
    baseURL: string
    model: string
}

type AdapterFactory = (input: AdapterFactoryInput) => AnyTextAdapter

const createAnthropicAdapter: AdapterFactory = ({ apiKey, baseURL, model }) => {
    // SAFETY: the SDK accepts arbitrary model IDs at runtime; its type only lists built-ins.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const anthropicModel = model as (typeof ANTHROPIC_MODELS)[number]

    return createAnthropicChat(anthropicModel, apiKey, { baseURL })
}

const createGeminiAdapter: AdapterFactory = ({ apiKey, baseURL, model }) => {
    // SAFETY: the SDK accepts arbitrary model IDs at runtime; its type only lists built-ins.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    const geminiModel = model as (typeof GEMINI_MODELS)[number]

    return createGeminiChat(geminiModel, apiKey, {
        httpOptions: { baseUrl: baseURL },
    })
}

const createOpenAIAdapter: AdapterFactory = ({ apiKey, baseURL, model }) =>
    openaiCompatibleText(model, {
        apiKey,
        baseURL,
    })

const adapterFactories = {
    anthropic: createAnthropicAdapter,
    gemini: createGeminiAdapter,
    openai: createOpenAIAdapter,
} satisfies Record<ModelProtocol, AdapterFactory>

// oxlint-disable-next-line anti-slop/no-unknown-parameters
const createChatAdapter = (request: Request, forwardedProps: unknown) => {
    const parsedConfiguration =
        modelConfigurationSchema.safeParse(forwardedProps)

    if (!parsedConfiguration.success) {
        // oxlint-disable-next-line typescript/only-throw-error
        throw new Response('Invalid model configuration', { status: 400 })
    }

    const configuration = parsedConfiguration.data
    const apiKey = getByokKey(request, configuration.credentialId)

    if (apiKey === null) {
        // oxlint-disable-next-line typescript/only-throw-error
        throw byokMissing(configuration.credentialId)
    }

    return adapterFactories[configuration.protocol]({
        apiKey,
        baseURL: configuration.baseUrl.replace(/\/$/u, ''),
        model: configuration.model,
    })
}

export default createChatAdapter
