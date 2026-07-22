import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripCallLog, TripCallLogQuery } from '@/types/api/trip/adminLog'

export function listCallLogs(query: TripCallLogQuery): Promise<TableDataInfo<TripCallLog>> {
  return request({ url: '/trip/admin/call-logs/page', method: 'get', params: query })
}
export function getCallLog(id: number): Promise<AjaxResult<TripCallLog>> {
  return request({ url: `/trip/admin/call-logs/${id}`, method: 'get' })
}
