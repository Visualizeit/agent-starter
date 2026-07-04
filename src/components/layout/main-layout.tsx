import { AppShell, Box, ScrollArea } from "@mantine/core";
import { Link, Outlet } from "@tanstack/react-router";

import ConversationList from "@/components/conversation/conversation-list";

const MainLayout = () => (
  <AppShell
    navbar={{
      breakpoint: 0,
      width: 232,
    }}
  >
    <AppShell.Main className="flex">
      <Box className="w-full relative">
        <Outlet />
      </Box>
    </AppShell.Main>
    <AppShell.Navbar p="xs">
      <AppShell.Section>
        <Link to="/">Logo</Link>
      </AppShell.Section>
      <AppShell.Section component={ScrollArea} grow>
        <ConversationList />
      </AppShell.Section>
      <AppShell.Section>Profile</AppShell.Section>
    </AppShell.Navbar>
  </AppShell>
);

export default MainLayout;
