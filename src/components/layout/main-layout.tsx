import { AppShell, Box, ScrollArea, Stack } from '@mantine/core'
import { Link, Outlet } from '@tanstack/react-router'

import ConversationList from '@/components/conversation/conversation-list'
import NewChatButton from '@/components/conversation/new-chat-button'
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
            <AppShell.Navbar className="gap-(--mantine-spacing-sm)">
                <AppShell.Section p="xs">
                    <Stack gap="xs">
                        <Link to="/">Logo</Link>
                        <NewChatButton />
                    </Stack>
                </AppShell.Section>
                <AppShell.Section component={ScrollArea} grow>
                    <Stack gap="sm" p="xs">
                        <ConversationList isPinned />
                        <ProjectList />
                        <ConversationList />
                    </Stack>
                </AppShell.Section>
                <AppShell.Section p="xs">Profile</AppShell.Section>
            </AppShell.Navbar>
        </AppShell>
    )
}

export default MainLayout
