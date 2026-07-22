import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripRoutebookPoint } from '@/types/api/trip/point'

/** 查询指定路书的全部点位。 */
export function listRoutebookPoints(routebookId: number): Promise<AjaxResult<TripRoutebookPoint[]>> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points`, method: 'get' })
}

/** 删除指定路书点位。 */
export function deleteRoutebookPoint(routebookId: number, pointId: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/points/${pointId}`, method: 'delete' })
}
