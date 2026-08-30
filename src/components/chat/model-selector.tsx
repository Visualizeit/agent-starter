import { ComboboxPopover, Text, UnstyledButton } from '@mantine/core'
import { modals } from '@mantine/modals'

import useModelStore from '@/stores/model-store'

import AddModelModal from './add-model-modal'

const ADD_MODEL_VALUE = '__add-model__'

const openAddModelModal = () => {
    modals.open({
        children: <AddModelModal />,
        title: 'Add model',
    })
}

interface ModelSelectorProps {
    disabled?: boolean
}

const ModelSelector = ({ disabled = false }: ModelSelectorProps) => {
    const registeredModels = useModelStore((state) => state.registeredModels)
    const selectedModel = useModelStore((state) => state.getSelectedModel())
    const selectModel = useModelStore((state) => state.selectModel)
    const selectedModelId = selectedModel ? selectedModel.credentialId : null

    const options = [
        ...registeredModels.map((model) => ({
            label: model.displayName,
            value: model.credentialId,
        })),
        { label: '+ Add model', value: ADD_MODEL_VALUE },
    ]

    return (
        <ComboboxPopover
            allowDeselect={false}
            checkIconPosition="right"
            comboboxProps={{
                position: 'top-start',
                shadow: 'md',
                width: 'max-content',
            }}
            data={options}
            onOptionSubmit={(value) => {
                if (value === ADD_MODEL_VALUE) {
                    openAddModelModal()

                    return
                }

                selectModel(value)
            }}
            value={selectedModelId}
            withAlignedLabels
        >
            <ComboboxPopover.Target>
                <UnstyledButton
                    aria-label="Select model"
                    className="h-8 max-w-full min-w-0 overflow-hidden rounded-(--mantine-radius-default) px-(--mantine-spacing-xs) text-(length:--mantine-font-size-sm) hover:bg-(--mantine-color-gray-light-hover)"
                    disabled={disabled}
                    type="button"
                >
                    <Text component="span" inherit truncate>
                        {selectedModel
                            ? selectedModel.displayName
                            : 'Select model'}
                    </Text>
                </UnstyledButton>
            </ComboboxPopover.Target>
        </ComboboxPopover>
    )
}

export default ModelSelector
