import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripInviteCreateRequest, TripInviteInfoVo, TripInviteLink, TripRoutebookMember } from '@/types/api/trip/share'

export function listInviteLinks(routebookId?: number): Promise<AjaxResult<TripInviteLink[]>> {
  return request({ url: '/trip/invite/list', method: 'get', params: { routebookId } })
}
export function createInviteLink(data: TripInviteCreateRequest): Promise<AjaxResult<TripInviteLink>> {
  return request({ url: '/trip/invite/create', method: 'post', data })
}
export function disableInviteLink(id: number): Promise<AjaxResult> {
  return request({ url: '/trip/invite/disable', method: 'post', params: { id } })
}
/** 公开邀请页：按邀请码查看邀请公开信息（无需登录） */
export function viewInviteByCode(inviteCode: string): Promise<AjaxResult<TripInviteInfoVo>> {
  return request({ url: `/invite/${encodeURIComponent(inviteCode)}`, method: 'get' })
}
/** 接受邀请并写入路书成员（需登录） */
export function acceptInviteByCode(inviteCode: string): Promise<AjaxResult<TripRoutebookMember>> {
  return request({ url: `/invite/${encodeURIComponent(inviteCode)}/accept`, method: 'post' })
}
