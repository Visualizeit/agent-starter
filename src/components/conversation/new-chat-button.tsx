import { Group, Text, UnstyledButton } from '@mantine/core'
import { Link } from '@tanstack/react-router'
import { cn } from 'cnfast'
import { PlusIcon } from 'lucide-react'

const NewChatButton = () => (
    <UnstyledButton
        className={cn(
            'block w-full',
            'rounded-(--mantine-radius-md) px-(--mantine-spacing-xs) py-(--mantine-spacing-sidebar-menu-item-y)',
            'hover:bg-(--mantine-color-gray-light-hover) focus-visible:bg-(--mantine-color-gray-light-hover)'
        )}
        renderRoot={(props) => (
            <Link to="/" {...props}>
                <Group gap="xs" wrap="nowrap">
                    <PlusIcon className="size-4 shrink-0 text-(--mantine-color-dimmed)" />
                    <Text className="min-w-0" size="sm" truncate>
                        New Chat
                    </Text>
                </Group>
            </Link>
        )}
    />
)

export default NewChatButton
