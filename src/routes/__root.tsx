import {
    ColorSchemeScript,
    MantineProvider,
    mantineHtmlProps,
} from '@mantine/core'
import { ModalsProvider } from '@mantine/modals'
import {
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
            <MantineProvider deduplicateInlineStyles theme={mantineTheme}>
                <ModalsProvider modalProps={{ centered: true }}>
                    <MainLayout />
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
                title: 'TanStack Starter',
            },
        ],
    }),
})
