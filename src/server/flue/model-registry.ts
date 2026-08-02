import { createModels } from '@earendil-works/pi-ai'
import { builtinProviders } from '@earendil-works/pi-ai/providers/all'

const modelRegistry = createModels()

for (const modelProvider of builtinProviders()) {
    modelRegistry.setProvider(modelProvider)
}

export default modelRegistry
