import { defineAgent, defineWorkflow } from '@flue/runtime'
import type { WorkflowRouteHandler } from '@flue/runtime'
import * as v from 'valibot'

const inputSchema = v.object({
    userMessage: v.pipe(v.string(), v.trim(), v.minLength(1)),
})

const outputSchema = v.object({
    title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
})

const instructions = `You will generate a short title based on the first message a user begins a conversation with.

<rules>
- Keep the title in the same language that the user wrote their message in.
- Ensure it is not more than 50 characters long.
- The title should be a summary of the user's message.
- It should be one line long.
- Do not use quotes or colons.
- The entire text you return will be used as the title.
- Never return anything that is more than one sentence (one line) long.
</rules>`

const titleAgent = defineAgent(() => ({
    instructions,
    model: process.env.FLUE_MODEL,
}))

export const route: WorkflowRouteHandler = (_context, next) => next()

const generateTitleWorkflow = defineWorkflow({
    agent: titleAgent,
    input: inputSchema,
    output: outputSchema,
    run: async ({ harness, input }) => {
        const session = await harness.session()

        const prompt = `Generate a concise title for the following content:

${input.userMessage}`

        const response = await session.prompt(prompt, {
            result: outputSchema,
        })

        return response.data
    },
})

export default generateTitleWorkflow
