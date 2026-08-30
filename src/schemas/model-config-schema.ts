import { BYOK_PROVIDER_ID_PATTERN } from '@tanstack/ai/byok'
import { z } from 'zod'

export const modelProtocolSchema = z.enum(['anthropic', 'gemini', 'openai'])

export const modelBaseUrlSchema = z.url().refine((baseUrl) => {
    const url = new URL(baseUrl)

    return (
        (url.protocol === 'http:' || url.protocol === 'https:') &&
        url.username === '' &&
        url.password === ''
    )
}, 'Use an HTTP(S) URL without embedded credentials')

export const modelConfigurationSchema = z.object({
    baseUrl: modelBaseUrlSchema,
    credentialId: z
        .string()
        .regex(BYOK_PROVIDER_ID_PATTERN, 'Invalid BYOK credential ID'),
    model: z.string().trim().min(1, 'Model ID is required').max(200),
    protocol: modelProtocolSchema,
})

export const modelRegistrationSchema = modelConfigurationSchema
    .omit({ credentialId: true })
    .extend({
        apiKey: z.string().trim().min(1, 'API key is required'),
        displayName: z.string().trim(),
    })

export const newConversationForwardedPropsSchema = modelConfigurationSchema
    .partial()
    .extend({
        newConversation: z.literal(true),
        projectId: z.string().min(1).optional(),
    })

export type ModelConfiguration = z.infer<typeof modelConfigurationSchema>
export type ModelProtocol = z.infer<typeof modelProtocolSchema>
export type ModelRegistration = z.infer<typeof modelRegistrationSchema>
export type NewConversationForwardedProps = z.infer<
    typeof newConversationForwardedPropsSchema
>
