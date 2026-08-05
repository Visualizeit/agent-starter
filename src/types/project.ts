import type { ORPCOutputs } from '@/lib/orpc'

export type ProjectDetails = ORPCOutputs['project']['find']

export type ProjectSummary = ORPCOutputs['project']['list']['list'][number]

export type ProjectConversationSummary = ProjectSummary['conversations'][number]
