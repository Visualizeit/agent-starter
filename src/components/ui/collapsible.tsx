'use client'

import { Collapsible as CollapsiblePrimitive } from '@base-ui/react/collapsible'
import { cn } from 'cnfast'
import type { ComponentPropsWithRef } from 'react'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = ({
    className,
    children,
    ...props
}: ComponentPropsWithRef<typeof CollapsiblePrimitive.Trigger>) => (
    <CollapsiblePrimitive.Trigger
        className={cn(
            'flex w-full items-center [&[data-state=open]>[data-slot=chevron]>svg]:rotate-180',
            className
        )}
        {...props}
    >
        {children}
    </CollapsiblePrimitive.Trigger>
)
CollapsibleTrigger.displayName = 'CollapsibleTrigger'

const CollapsibleContent = ({
    className,
    children,
    ...props
}: ComponentPropsWithRef<typeof CollapsiblePrimitive.Panel>) => (
    <CollapsiblePrimitive.Panel
        className={cn(
            'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
            className
        )}
        {...props}
    >
        {children}
    </CollapsiblePrimitive.Panel>
)
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
