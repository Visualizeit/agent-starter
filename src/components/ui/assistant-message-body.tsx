import { Box } from '@mantine/core'
import type { ReactNode } from 'react'

interface AssistantMessageBodyProps {
    children: ReactNode
}

const AssistantMessageBody = ({ children }: AssistantMessageBodyProps) => (
    <Box className="w-fit min-w-0 max-w-full self-start wrap-break-word">
        {children}
    </Box>
)

export default AssistantMessageBody
