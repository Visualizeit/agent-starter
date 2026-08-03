import type { PromptUsage } from '@flue/runtime'
import { z } from 'zod'

const usageSchema = z.object({
    cacheRead: z.int().nonnegative(),
    cacheWrite: z.int().nonnegative(),
    cost: z.object({
        cacheRead: z.number().nonnegative(),
        cacheWrite: z.number().nonnegative(),
        input: z.number().nonnegative(),
        output: z.number().nonnegative(),
        total: z.number().nonnegative(),
    }),
    input: z.int().nonnegative(),
    output: z.int().nonnegative(),
    totalTokens: z.int().nonnegative(),
}) satisfies z.ZodType<PromptUsage>

const timingSchema = z.object({
    completedAt: z.int().nonnegative(),
    startedAt: z.int().nonnegative(),
})

export const assistantMessageMetadataSchema = z.object({
    model: z.string().min(1),
    timing: timingSchema,
    usage: usageSchema,
})

export const assistantMessageMetadataStartSchema = z.object({
    model: assistantMessageMetadataSchema.shape.model,
    timing: timingSchema.pick({ startedAt: true }),
})
