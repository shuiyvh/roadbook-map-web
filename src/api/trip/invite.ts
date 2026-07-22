import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripInviteCreateRequest, TripInviteLink } from '@/types/api/trip/share'

export function listInviteLinks(routebookId?: number): Promise<AjaxResult<TripInviteLink[]>> {
  return request({ url: '/trip/invite/list', method: 'get', params: { routebookId } })
}
export function createInviteLink(data: TripInviteCreateRequest): Promise<AjaxResult<TripInviteLink>> {
  return request({ url: '/trip/invite/create', method: 'post', data })
}
export function disableInviteLink(id: number): Promise<AjaxResult> {
  return request({ url: '/trip/invite/disable', method: 'post', params: { id } })
}
