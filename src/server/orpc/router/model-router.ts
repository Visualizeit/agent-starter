import modelRegistry from '@/server/flue/model-registry'

import base from '../base'

const modelRouter = {
    list: base.handler(async () => {
        const models = await modelRegistry.getAvailable()

        const providersById = new Map(
            modelRegistry
                .getProviders()
                .map((provider) => [provider.id, provider.name])
        )

        return {
            list: models.map((model) => ({
                contextWindow: model.contextWindow,
                id: `${model.provider}/${model.id}`,
                input: model.input,
                maxTokens: model.maxTokens,
                name: model.name,
                providerId: model.provider,
                providerName:
                    providersById.get(model.provider) ?? model.provider,
                reasoning: model.reasoning,
            })),
        }
    }),
}

export default modelRouter
