import { defaultByokStorage, defineByok } from '@tanstack/ai-client/byok'

const byok = defineByok({
    storage: defaultByokStorage(),
})

export default byok
