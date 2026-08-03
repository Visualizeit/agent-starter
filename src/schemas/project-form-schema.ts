import { z } from 'zod'

export const projectFormSchema = z.object({
    instructions: z.string().trim().max(20_000),
    name: z.string().trim().min(1).max(200),
})
