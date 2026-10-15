import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripPointComment } from '@/types/api/trip/point'

/** 查询点位评论列表。 */
export function listPointComments(routebookId: number, pointId: number): Promise<AjaxResult<TripPointComment[]>> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}/comments`, method: 'get' })
}

/** 新增点位评论。 */
export function addPointComment(routebookId: number, pointId: number, data: TripPointComment): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}/comments`, method: 'post', data })
}

/** 修改点位评论（仅作者本人或管理员）。 */
export function updatePointComment(
  routebookId: number,
  pointId: number,
  commentId: number,
  data: TripPointComment
): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}/comments/${commentId}`, method: 'put', data })
}

/** 删除点位评论（仅作者本人或管理员）。 */
export function deletePointComment(routebookId: number, pointId: number, commentId: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}/comments/${commentId}`, method: 'delete' })
}