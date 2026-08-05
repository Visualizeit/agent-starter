import type { ORPCOutputs } from '@/lib/orpc'

type AttachmentList = ORPCOutputs['attachment']['list']['list']

export type AttachmentListItem = AttachmentList[number]
