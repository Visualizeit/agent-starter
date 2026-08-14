import { ChevronDownIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Collapse, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { cn } from 'cnfast'
import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface AssistantMessageProcessProps {
    children: ReactNode
    isResponding: boolean
}

const AssistantMessageProcess = ({
    children,
    isResponding,
}: AssistantMessageProcessProps) => {
    const [isOpen, { close, open, toggle }] = useDisclosure(isResponding)

    useEffect(() => {
        if (isResponding) {
            open()

            return
        }

        close()
    }, [close, isResponding, open])

    return (
        <Stack gap="sm">
            <UnstyledButton aria-expanded={isOpen} onClick={toggle}>
                <Group gap="xs">
                    <Text
                        c="dimmed"
                        className={cn(isResponding && 'shimmer')}
                        size="sm"
                    >
                        {isResponding ? 'Thinking...' : 'Process'}
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
            <Collapse expanded={isOpen} keepMounted={false}>
                <Stack gap="sm">{children}</Stack>
            </Collapse>
        </Stack>
    )
}

export default AssistantMessageProcess
