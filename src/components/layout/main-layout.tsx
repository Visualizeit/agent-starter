import { AppShell, Box, ScrollArea, Stack } from '@mantine/core'
import { Link, Outlet } from '@tanstack/react-router'

import NewChatButton from '@/components/conversation/new-chat-button'
import PinnedConversationList from '@/components/conversation/pinned-conversation-list'
import RecentConversationList from '@/components/conversation/recent-conversation-list'
import useConversationEvents from '@/components/conversation/use-conversation-events'
import ResizablePanels from '@/components/layout/resizable-panels'
import ProjectList from '@/components/project/project-list'

const MainLayout = () => {
    useConversationEvents()

    return (
        <AppShell>
            <AppShell.Main className="flex">
                <Box className="w-full">
                    <ResizablePanels
                        leftPanel={
                            <Stack
                                className="absolute inset-0 py-(--mantine-spacing-xs)"
                                component="aside"
                                gap="sm"
                            >
                                <Stack
                                    className="px-(--mantine-spacing-xs)"
                                    gap="xs"
                                >
                                    <Link to="/">Logo</Link>
                                    <NewChatButton />
                                </Stack>
                                <ScrollArea className="min-h-0 flex-1">
                                    <Stack
                                        gap="sm"
                                        className="p-(--mantine-spacing-xs)"
                                    >
                                        <PinnedConversationList />
                                        <ProjectList />
                                        <RecentConversationList />
                                    </Stack>
                                </ScrollArea>
                                <Box className="px-(--mantine-spacing-xs)">
                                    Profile
                                </Box>
                            </Stack>
                        }
                        rightPanel={<Outlet />}
                    />
                </Box>
            </AppShell.Main>
        </AppShell>
    )
}

export default MainLayout
