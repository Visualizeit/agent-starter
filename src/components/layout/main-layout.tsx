import { AppShell, Box, ScrollArea, Stack } from '@mantine/core'
import { Link, Outlet } from '@tanstack/react-router'

import NewChatButton from '@/components/conversation/new-chat-button'
import PinnedConversationList from '@/components/conversation/pinned-conversation-list'
import RecentConversationList from '@/components/conversation/recent-conversation-list'
import useConversationEvents from '@/components/conversation/use-conversation-events'
import ProjectList from '@/components/project/project-list'

const MainLayout = () => {
    useConversationEvents()

    return (
        <AppShell
            navbar={{
                breakpoint: 0,
                width: 240,
            }}
        >
            <AppShell.Main className="flex">
                <Box className="w-full relative">
                    <Outlet />
                </Box>
            </AppShell.Main>
            <AppShell.Navbar className="gap-(--mantine-spacing-sm) py-(--mantine-spacing-xs)">
                <AppShell.Section className="px-(--mantine-spacing-xs)">
                    <Stack gap="xs">
                        <Link to="/">Logo</Link>
                        <NewChatButton />
                    </Stack>
                </AppShell.Section>
                <AppShell.Section component={ScrollArea} grow>
                    <Stack gap="sm" className="p-(--mantine-spacing-xs)">
                        <PinnedConversationList />
                        <ProjectList />
                        <RecentConversationList />
                    </Stack>
                </AppShell.Section>
                <AppShell.Section className="px-(--mantine-spacing-xs)">
                    Profile
                </AppShell.Section>
            </AppShell.Navbar>
        </AppShell>
    )
}

export default MainLayout
