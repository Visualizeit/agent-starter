import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
    v8CssVariablesResolver,
} from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import { Notifications } from '@mantine/notifications'
import {
    ClientOnly,
    createRootRouteWithContext,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'

import MainLayout from '@/components/layout/main-layout'
import mantineTheme from '@/configs/mantine-theme'
import type { RouterContext } from '@/router'

import appCSSURL from '@/app.css?url'

const Component = () => (
    <html lang="en" {...mantineHtmlProps}>
        <head>
            <HeadContent />
            <ColorSchemeScript />
        </head>
        <body>
            <MantineProvider
                deduplicateInlineStyles
                theme={mantineTheme}
                cssVariablesResolver={v8CssVariablesResolver}
            >
                <Notifications />
                <ModalsProvider modalProps={{ centered: true }}>
                    <ClientOnly>
                        <MainLayout />
                    </ClientOnly>
                </ModalsProvider>
            </MantineProvider>
            <Scripts />
        </body>
    </html>
)

export const Route = createRootRouteWithContext<RouterContext>()({
    component: Component,
    head: () => ({
        links: [
            { href: '/favicon.svg', rel: 'icon', type: 'image/svg+xml' },
            { href: appCSSURL, rel: 'stylesheet' },
        ],
        meta: [
            {
                // oxlint-disable-next-line unicorn/text-encoding-identifier-case
                charSet: 'utf-8',
            },
            {
                content: 'width=device-width, initial-scale=1',
                name: 'viewport',
            },
            {
                title: 'Agent Starter',
            },
        ],
    }),
})
