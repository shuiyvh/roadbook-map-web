import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripAuditLog, TripAuditLogQuery } from '@/types/api/trip/adminLog'

export function listAuditLogs(query: TripAuditLogQuery): Promise<TableDataInfo<TripAuditLog>> {
  return request({ url: '/trip/admin/audit-logs/page', method: 'get', params: query })
}
export function getAuditLog(id: number): Promise<AjaxResult<TripAuditLog>> {
  return request({ url: `/trip/admin/audit-logs/${id}`, method: 'get' })
}
