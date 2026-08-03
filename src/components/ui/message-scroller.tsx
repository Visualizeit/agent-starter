'use client'

import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { MessageScroller as MessageScrollerPrimitive } from '@shadcn/react/message-scroller'
import { cn } from 'cnfast'
import * as React from 'react'

import { Button } from '@/components/ui/button'

const MessageScrollerProvider = (
    props: React.ComponentProps<typeof MessageScrollerPrimitive.Provider>
) => <MessageScrollerPrimitive.Provider {...props} />

const MessageScroller = ({
    className,
    ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Root>) => (
    <MessageScrollerPrimitive.Root
        data-slot="message-scroller"
        className={cn(
            'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
            className
        )}
        {...props}
    />
)

const MessageScrollerViewport = ({
    className,
    ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Viewport>) => (
    <MessageScrollerPrimitive.Viewport
        data-slot="message-scroller-viewport"
        className={cn(
            'size-full min-h-0 min-w-0 scroll-fade-b scrollbar-thin scrollbar-gutter-stable overflow-y-auto overscroll-contain contain-content data-autoscrolling:scrollbar-thumb-transparent data-autoscrolling:scrollbar-track-transparent',
            className
        )}
        {...props}
    />
)

const MessageScrollerContent = ({
    className,
    ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Content>) => (
    <MessageScrollerPrimitive.Content
        data-slot="message-scroller-content"
        className={cn(
            'flex h-max min-h-full flex-col gap-(--mantine-spacing-xs)',
            className
        )}
        {...props}
    />
)

const MessageScrollerItem = ({
    className,
    scrollAnchor = false,
    ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Item>) => (
    <MessageScrollerPrimitive.Item
        data-slot="message-scroller-item"
        scrollAnchor={scrollAnchor}
        className={cn('min-w-0 shrink-0', className)}
        {...props}
    />
)

const MessageScrollerButton = ({
    direction = 'end',
    className,
    children,
    render,
    variant = 'secondary',
    size = 'icon-sm',
    ...props
}: React.ComponentProps<typeof MessageScrollerPrimitive.Button> &
    Pick<React.ComponentProps<typeof Button>, 'variant' | 'size'>) => (
    <MessageScrollerPrimitive.Button
        data-slot="message-scroller-button"
        data-direction={direction}
        data-variant={variant}
        data-size={size}
        direction={direction}
        className={cn(
            'absolute inset-s-1/2 -translate-x-1/2 border-border bg-background text-foreground transition-[translate,scale,opacity] duration-200 hover:bg-muted hover:text-foreground data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=false]:duration-400 data-[active=false]:ease-[cubic-bezier(0.7,0,0.84,0)] data-[active=true]:translate-y-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[active=true]:ease-[cubic-bezier(0.23,1,0.32,1)] data-[direction=end]:bottom-4 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:top-4 data-[direction=start]:data-[active=false]:-translate-y-full rtl:translate-x-1/2 data-[direction=start]:[&_svg]:rotate-180',
            className
        )}
        render={render ?? <Button variant={variant} size={size} />}
        {...props}
    >
        {children ?? (
            <>
                <HugeiconsIcon icon={ArrowDown01Icon} />
                <span className="sr-only">
                    {direction === 'end' ? 'Scroll to end' : 'Scroll to start'}
                </span>
            </>
        )}
    </MessageScrollerPrimitive.Button>
)

export {
    MessageScrollerProvider,
    MessageScroller,
    MessageScrollerViewport,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerButton,
}
export {
    useMessageScroller,
    useMessageScrollerScrollable,
    useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller'
