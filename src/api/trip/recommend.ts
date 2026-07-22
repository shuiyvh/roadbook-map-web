import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripRecommend, TripRecommendAddPointRequest, TripRecommendQuery, TripRecommendSearchRequest } from '@/types/api/trip/recommend'

/** 查询大屏推荐结果分页列表。 */
export function listRecommendations(query: TripRecommendQuery): Promise<TableDataInfo<TripRecommend>> {
  return request({
    url: '/trip/screen/recommend/list',
    method: 'get',
    params: query
  })
}

export function searchRecommendations(data: TripRecommendSearchRequest): Promise<AjaxResult> {
  return request({ url: '/trip/screen/recommend/search', method: 'post', data })
}

export function generateRecommendationAi(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/recommend/${id}/ai`, method: 'post' })
}

export function addRecommendationToRoutebook(id: number, data: TripRecommendAddPointRequest): Promise<AjaxResult> {
  return request({ url: `/trip/screen/recommend/${id}/add-to-routebook`, method: 'post', data })
}
