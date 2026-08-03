'use client'

import { ChevronDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { cjk } from '@streamdown/cjk'
import { code } from '@streamdown/code'
import { math } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { cn } from 'cnfast'
import type { ComponentProps } from 'react'
import { Streamdown } from 'streamdown'

interface ReasoningProps {
    children: ComponentProps<typeof Streamdown>['children']
    isStreaming?: boolean
}

const streamdownPlugins = { cjk, code, math, mermaid }

const Reasoning = ({ children, isStreaming = false }: ReasoningProps) => {
    const [isOpen, { toggle }] = useDisclosure(isStreaming)

    return (
        <Stack gap="sm">
            <UnstyledButton aria-expanded={isOpen} onClick={toggle}>
                <Group gap="xs">
                    <Text
                        c="dimmed"
                        className={cn(isStreaming && 'shimmer')}
                        size="sm"
                    >
                        {isStreaming
                            ? 'Thinking...'
                            : 'Thought for a few seconds'}
                    </Text>
                    <HugeiconsIcon
                        icon={ChevronDownIcon}
                        className={cn(
                            'size-4 text-(--mantine-color-dimmed) transition-transform',
                            isOpen && 'rotate-180'
                        )}
                    />
                </Group>
            </UnstyledButton>
            <Collapse
                className="text-muted-foreground text-sm"
                expanded={isOpen}
                keepMounted={false}
            >
                <Streamdown plugins={streamdownPlugins}>{children}</Streamdown>
            </Collapse>
        </Stack>
    )
}

export default Reasoning
