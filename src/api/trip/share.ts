import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripShareCreateRequest, TripShareLink, TripShareRoutebookVo } from '@/types/api/trip/share'

export function listShareLinks(routebookId?: number): Promise<AjaxResult<TripShareLink[]>> {
  return request({ url: '/trip/share/list', method: 'get', params: { routebookId } })
}
export function createShareLink(data: TripShareCreateRequest): Promise<AjaxResult<TripShareLink>> {
  return request({ url: '/trip/share/create', method: 'post', data })
}
export function disableShareLink(id: number): Promise<AjaxResult> {
  return request({ url: '/trip/share/disable', method: 'post', params: { id } })
}
/** 公开分享页：按分享码查看路书公开信息（无需登录；有访问密码时通过 password 参数提交） */
export function viewShareByCode(shareCode: string, password?: string): Promise<AjaxResult<TripShareRoutebookVo>> {
  return request({ url: `/s/${encodeURIComponent(shareCode)}`, method: 'get', params: password ? { password } : undefined })
}
