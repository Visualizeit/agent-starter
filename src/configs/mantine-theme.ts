import { Badge, Button, Container, createTheme, Switch } from '@mantine/core'
import type {
    DefaultMantineColor,
    DefaultMantineSize,
    MantineColorsTuple,
} from '@mantine/core'

type ExtendedCustomColors = 'brand' | DefaultMantineColor

type ExtendedCustomSpacing =
    | 'sidebar-menu-item-y'
    | 'xxs'
    | 'xxxs'
    | DefaultMantineSize

type ExtendedCustomRadius = '2xl' | '3xl' | '4xl' | 'full' | DefaultMantineSize

declare module '@mantine/core' {
    export interface MantineThemeColorsOverride {
        colors: Record<ExtendedCustomColors, MantineColorsTuple>
    }

    export interface MantineThemeSizesOverride {
        radius: Record<ExtendedCustomRadius, string>
        spacing: Record<ExtendedCustomSpacing, string>
    }
}

const mantineTheme = createTheme({
    activeClassName: 'active:brightness-90',
    colors: {
        brand: [
            '#e3f7ff',
            '#cde9ff',
            '#9cd0ff',
            '#67b6fd',
            '#3ca0fa',
            '#2292fa',
            '#0485f7',
            '#0078e1',
            '#006bca',
            '#005cb3',
        ],
    },
    components: {
        Badge: Badge.extend({
            classNames: { root: 'font-(--mantine-font-weight-regular)' },
        }),
        Button: Button.extend({
            classNames: { root: 'font-(--mantine-font-weight-regular)' },
        }),
        Container: Container.extend({ defaultProps: { strategy: 'grid' } }),
        Switch: Switch.extend({ defaultProps: { withThumbIndicator: false } }),
    },
    defaultRadius: 'lg',
    headings: {
        fontWeight: 'var(--mantine-font-weight-medium)',
    },
    primaryColor: 'brand',
    radius: {
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
        full: 'calc(infinity * 1px)',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) * 0.8)',
        sm: 'calc(var(--radius) * 0.6)',
        xl: 'calc(var(--radius) * 1.4)',
        xs: 'calc(var(--radius) * 0.4)',
    },
    spacing: {
        'sidebar-menu-item-y': 'calc(0.375rem * var(--mantine-scale))',
        xxs: 'calc(0.5rem * var(--mantine-scale))',
        xxxs: 'calc(0.25rem * var(--mantine-scale))',
    },
})

export default mantineTheme
