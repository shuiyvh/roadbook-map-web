import type { PageDomain } from '@/types/api/common'

export interface TripAuditLogQuery extends PageDomain {
  operationType?: string
  operationName?: string
  businessType?: string
  routebookId?: number
  journeyId?: number
  userName?: string
  resultStatus?: string
}

export interface TripAuditLog {
  id?: number
  operationType?: string
  operationName?: string
  businessType?: string
  businessId?: number
  routebookId?: number
  journeyId?: number
  userId?: number
  userName?: string
  resultStatus?: string
  operationSummary?: string
  failureReason?: string
  clientType?: string
  extraInfo?: string
  createTime?: string
}

export interface TripCallLogQuery extends PageDomain {
  provider?: string
  callType?: string
  businessType?: string
  routebookId?: number
  resultStatus?: string
}

export interface TripCallLog {
  id?: number
  provider?: string
  callType?: string
  endpoint?: string
  businessType?: string
  businessId?: number
  routebookId?: number
  pointId?: number
  userId?: number
  resultStatus?: string
  durationMs?: number
  requestSummary?: string
  responseSummary?: string
  errorMsg?: string
  createTime?: string
}
