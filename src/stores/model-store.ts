import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { ModelConfiguration } from '@/schemas/model-config-schema'

export interface RegisteredModel extends ModelConfiguration {
    displayName: string
}

export interface ModelStore {
    addModel: (model: RegisteredModel) => void
    getSelectedModel: () => RegisteredModel | null
    registeredModels: RegisteredModel[]
    selectedModelId: string | null
    selectModel: (modelId: string) => void
}

const useModelStore = create<ModelStore>()(
    persist(
        (set, get) => ({
            addModel: (model) => {
                set((state) => ({
                    registeredModels: [...state.registeredModels, model],
                    selectedModelId: model.credentialId,
                }))
            },
            getSelectedModel: () => {
                const state = get()

                return (
                    state.registeredModels.find(
                        (model) => model.credentialId === state.selectedModelId
                    ) ?? null
                )
            },
            registeredModels: [],
            selectModel: (modelId) => {
                set({ selectedModelId: modelId })
            },
            selectedModelId: null,
        }),
        { name: 'agent-starter-models' }
    )
)

export default useModelStore
