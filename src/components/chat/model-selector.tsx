import { ChevronDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { ComboboxPopover, Group, Text, UnstyledButton } from '@mantine/core'
import { useSuspenseQuery } from '@tanstack/react-query'
import { cn } from 'cnfast'
import { groupBy, keyBy } from 'es-toolkit'
import { useEffect } from 'react'

import orpc from '@/lib/orpc'

interface ModelSelectorProps {
    onChange: (value: string | null) => void
    value: string | null
}

const ModelSelector = ({ onChange, value }: ModelSelectorProps) => {
    const { data } = useSuspenseQuery(
        orpc.model.list.queryOptions({
            select: (models) => {
                const groupedModels = groupBy(
                    models.list,
                    (model) => model.providerName
                )

                return {
                    hasModels: models.list.length > 0,
                    modelsById: keyBy(models.list, (model) => model.id),
                    options: Object.entries(groupedModels).map(
                        ([providerName, providerModels]) => ({
                            group: providerName,
                            items: providerModels.map((model) => ({
                                label: model.name,
                                value: model.id,
                            })),
                        })
                    ),
                }
            },
        })
    )
    const selectedModel = value ? data.modelsById[value] : undefined

    useEffect(() => {
        if (value && !selectedModel) {
            onChange(null)
        }
    }, [onChange, selectedModel, value])

    return (
        <ComboboxPopover
            allowDeselect={false}
            comboboxProps={{ position: 'top-start', width: 320 }}
            data={data.options}
            maxDropdownHeight={320}
            nothingFoundMessage="No models found"
            onChange={(nextValue) => {
                if (nextValue) {
                    onChange(nextValue)
                }
            }}
            searchable
            value={value}
        >
            <ComboboxPopover.Target>
                <UnstyledButton
                    aria-label="Select model"
                    className={cn(
                        'rounded-(--mantine-radius-default) px-(--mantine-spacing-xs) py-(--mantine-spacing-sidebar-menu-item-y)',
                        'hover:bg-(--mantine-color-gray-light-hover) focus-visible:bg-(--mantine-color-gray-light-hover) aria-expanded:bg-(--mantine-color-gray-light-hover)'
                    )}
                    disabled={!data.hasModels}
                    type="button"
                >
                    <Group gap="xxs" wrap="nowrap">
                        <Text lineClamp={1} size="sm">
                            {selectedModel
                                ? selectedModel.name
                                : 'Select model'}
                        </Text>
                        <HugeiconsIcon
                            icon={ChevronDownIcon}
                            className="size-4"
                        />
                    </Group>
                </UnstyledButton>
            </ComboboxPopover.Target>
        </ComboboxPopover>
    )
}

export default ModelSelector
