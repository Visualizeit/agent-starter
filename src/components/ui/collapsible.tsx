'use client'

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import * as React from 'react'

import { cn } from '@/lib/utils'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = React.forwardRef<
    React.ComponentRef<typeof CollapsiblePrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.Trigger
        ref={ref}
        className={cn(
            'flex w-full items-center [&[data-state=open]>[data-slot=chevron]>svg]:rotate-180',
            className
        )}
        {...props}
    >
        {children}
    </CollapsiblePrimitive.Trigger>
))
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

const CollapsibleContent = React.forwardRef<
    React.ComponentRef<typeof CollapsiblePrimitive.Panel>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Panel>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.Panel
        ref={ref}
        className={cn(
            'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
            className
        )}
        {...props}
    >
        {children}
    </CollapsiblePrimitive.Panel>
))
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
