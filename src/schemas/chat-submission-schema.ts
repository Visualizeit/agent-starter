import { z } from 'zod'

export const chatSubmissionSchema = z.object({
    message: z.string().trim().min(1),
})
