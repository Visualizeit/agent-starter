import { Box } from '@mantine/core'
import type { ReactNode } from 'react'

interface UserMessageBodyProps {
    children: ReactNode
}

const UserMessageBody = ({ children }: UserMessageBodyProps) => (
    <Box className="w-fit max-w-4/5 min-w-0 self-end rounded-(--mantine-radius-3xl) bg-(--mantine-color-gray-light) px-(--mantine-spacing-md) py-(--mantine-spacing-sm) wrap-break-word">
        {children}
    </Box>
)

export default UserMessageBody
