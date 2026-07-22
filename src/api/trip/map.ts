import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { AmapNavigationUriRequest, AmapRoutePlanRequest, PoiItem, PoiSearchQuery } from '@/types/api/trip/map'

export function searchPoi(query: PoiSearchQuery): Promise<AjaxResult<PoiItem[] | Record<string, unknown>>> {
  return request({ url: '/trip/screen/map/poi/search', method: 'get', params: query })
}
export function getPoiDetail(id: string, showFields?: string): Promise<AjaxResult<Record<string, unknown>>> {
  return request({ url: '/trip/screen/map/poi/detail', method: 'get', params: { id, showFields } })
}
export function planRoute(data: AmapRoutePlanRequest): Promise<AjaxResult<Record<string, unknown>>> {
  return request({ url: '/trip/screen/map/route/plan', method: 'post', data })
}
export function createNavigationUri(data: AmapNavigationUriRequest): Promise<AjaxResult<string | Record<string, unknown>>> {
  return request({ url: '/trip/screen/map/navigation-uri', method: 'post', data })
}
