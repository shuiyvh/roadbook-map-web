import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripRoutebookPoint } from '@/types/api/trip/point'

/** 查询指定路书的全部点位。 */
export function listRoutebookPoints(routebookId: number): Promise<AjaxResult<TripRoutebookPoint[]>> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points`, method: 'get' })
}

/** 向指定路书新增点位。 */
export function addRoutebookPoint(routebookId: number, data: TripRoutebookPoint): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points`, method: 'post', data })
}

/** 修改指定路书中的点位配置。 */
export function updateRoutebookPoint(routebookId: number, pointId: number, data: TripRoutebookPoint): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}`, method: 'put', data })
}

/** 按前端编排结果保存指定路书的点位顺序。 */
export function sortRoutebookPoints(routebookId: number, points: TripRoutebookPoint[]): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/sort`, method: 'put', data: points })
}

/** 删除指定路书点位。 */
export function deleteRoutebookPoint(routebookId: number, pointId: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}`, method: 'delete' })
}
