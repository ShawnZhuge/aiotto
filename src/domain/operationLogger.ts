import type { OperationLogInput } from './operationLogs'

export type OperationLogDraft = Omit<OperationLogInput, 'id' | 'createdAtEpochMs'> & {
  id?: string
  createdAtEpochMs?: number
}

export type OperationLogger = (draft: OperationLogDraft) => void
