'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { cn } from 'cn'
import type { ComponentPropsWithRef } from 'react'

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = ({
    className,
    children,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Trigger>) => (
    <SelectPrimitive.Trigger
        className={cn(
            'border-input bg-background ring-offset-background placeholder:text-muted-foreground focus:ring-ring flex h-9 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm whitespace-nowrap shadow-sm focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate',
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon className="ml-1 flex size-4 shrink-0 opacity-50">
            <svg
                aria-hidden="true"
                className="size-4"
                fill="none"
                height="24"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="24"
            >
                <path d="m6 9 6 6 6-6" />
            </svg>
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({
    className,
    children,
    align = 'start',
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Positioner>) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner
            align={align}
            className={cn(
                'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 relative z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md',
                className
            )}
            {...props}
        >
            <SelectPrimitive.Popup className="max-h-[--anchor-max-height] w-full min-w-[var(--anchor-width)] overflow-x-hidden overflow-y-auto">
                <SelectPrimitive.List>{children}</SelectPrimitive.List>
            </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
)
SelectContent.displayName = 'SelectContent'

const SelectItem = ({
    className,
    children,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Item>) => (
    <SelectPrimitive.Item
        className={cn(
            'focus:bg-accent focus:text-accent-foreground relative flex w-full cursor-default items-center rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
        {...props}
    >
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
            <SelectPrimitive.ItemIndicator>
                <svg
                    aria-hidden="true"
                    className="size-4"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                >
                    <path d="M5 12l5 5L20 7" />
                </svg>
            </SelectPrimitive.ItemIndicator>
        </span>
        <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
)
SelectItem.displayName = 'SelectItem'

const SelectLabel = ({
    className,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.GroupLabel>) => (
    <SelectPrimitive.GroupLabel
        className={cn('px-2 py-1.5 text-sm font-semibold', className)}
        {...props}
    />
)
SelectLabel.displayName = 'SelectLabel'

const SelectSeparator = ({
    className,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.Separator>) => (
    <SelectPrimitive.Separator
        className={cn('bg-muted -mx-1 my-1 h-px', className)}
        {...props}
    />
)
SelectSeparator.displayName = 'SelectSeparator'

const SelectScrollUpButton = ({
    className,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.ScrollUpArrow>) => (
    <SelectPrimitive.ScrollUpArrow
        className={cn(
            'flex cursor-default items-center justify-center py-1',
            className
        )}
        {...props}
    >
        <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
        >
            <path d="m18 15-6-6-6 6" />
        </svg>
    </SelectPrimitive.ScrollUpArrow>
)
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

const SelectScrollDownButton = ({
    className,
    ...props
}: ComponentPropsWithRef<typeof SelectPrimitive.ScrollDownArrow>) => (
    <SelectPrimitive.ScrollDownArrow
        className={cn(
            'flex cursor-default items-center justify-center py-1',
            className
        )}
        {...props}
    >
        <svg
            aria-hidden="true"
            className="size-4"
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    </SelectPrimitive.ScrollDownArrow>
)
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

export {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectScrollDownButton,
    SelectScrollUpButton,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
}
