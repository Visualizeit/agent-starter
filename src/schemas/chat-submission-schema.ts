import { z } from 'zod'

export const modelSchema = z.string().trim().min(1).max(120)

export const chatSubmissionSchema = z.object({
    message: z.string().trim().min(1),
    model: modelSchema,
})
