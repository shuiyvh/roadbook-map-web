import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripShareCreateRequest, TripShareLink } from '@/types/api/trip/share'

export function listShareLinks(routebookId?: number): Promise<AjaxResult<TripShareLink[]>> {
  return request({ url: '/trip/share/list', method: 'get', params: { routebookId } })
}
export function createShareLink(data: TripShareCreateRequest): Promise<AjaxResult<TripShareLink>> {
  return request({ url: '/trip/share/create', method: 'post', data })
}
export function disableShareLink(id: number): Promise<AjaxResult> {
  return request({ url: '/trip/share/disable', method: 'post', params: { id } })
}
