import { AppShell, Box } from '@mantine/core'
import { Outlet } from '@tanstack/react-router'

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
        <AppShell.Navbar></AppShell.Navbar>
    </AppShell>
)

export default MainLayout
