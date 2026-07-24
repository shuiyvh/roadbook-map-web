import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripRoutebookSegment } from '@/types/api/trip/point'

/** 查询指定路书的全部分段路线。 */
export function listRoutebookSegments(routebookId: number): Promise<AjaxResult<TripRoutebookSegment[]>> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/segments`, method: 'get' })
}

/** 重新计算指定路书的全部分段路线。 */
export function recalculateRoutebookSegments(routebookId: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${routebookId}/segments/recalculate`, method: 'post' })
}
