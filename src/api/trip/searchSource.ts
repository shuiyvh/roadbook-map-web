import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripSearchSource, TripSearchSourceQuery } from '@/types/api/trip/adminConfig'

export function listSearchSources(query: TripSearchSourceQuery): Promise<TableDataInfo<TripSearchSource>> {
  return request({ url: '/trip/admin/search-sources/page', method: 'get', params: query })
}
export function getSearchSource(id: number): Promise<AjaxResult<TripSearchSource>> {
  return request({ url: `/trip/admin/search-sources/${id}`, method: 'get' })
}
export function addSearchSource(data: TripSearchSource): Promise<AjaxResult> {
  return request({ url: '/trip/admin/search-sources', method: 'post', data })
}
export function updateSearchSource(data: TripSearchSource): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-sources/${data.id}`, method: 'put', data })
}
export function deleteSearchSource(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-sources/${id}`, method: 'delete' })
}
export function toggleSearchSource(id: number, enabled: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-sources/${id}/enabled/${enabled}`, method: 'put' })
}
