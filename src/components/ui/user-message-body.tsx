import { Box } from '@mantine/core'
import type { ReactNode } from 'react'

interface UserMessageBodyProps {
    children: ReactNode
}

const UserMessageBody = ({ children }: UserMessageBodyProps) => (
    <Box className="w-fit min-w-0 max-w-4/5 self-end wrap-break-word rounded-(--mantine-radius-3xl) bg-(--mantine-color-gray-light) px-(--mantine-spacing-md) py-(--mantine-spacing-sm)">
        {children}
    </Box>
)

export default UserMessageBody
