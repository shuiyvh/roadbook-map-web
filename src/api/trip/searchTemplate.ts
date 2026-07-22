import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripSearchTemplate, TripSearchTemplateQuery } from '@/types/api/trip/adminConfig'

export function listSearchTemplates(query: TripSearchTemplateQuery): Promise<TableDataInfo<TripSearchTemplate>> {
  return request({ url: '/trip/admin/search-templates/page', method: 'get', params: query })
}
export function getSearchTemplate(id: number): Promise<AjaxResult<TripSearchTemplate>> {
  return request({ url: `/trip/admin/search-templates/${id}`, method: 'get' })
}
export function addSearchTemplate(data: TripSearchTemplate): Promise<AjaxResult> {
  return request({ url: '/trip/admin/search-templates', method: 'post', data })
}
export function updateSearchTemplate(data: TripSearchTemplate): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-templates/${data.id}`, method: 'put', data })
}
export function deleteSearchTemplate(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-templates/${id}`, method: 'delete' })
}
export function toggleSearchTemplate(id: number, enabled: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/search-templates/${id}/enabled/${enabled}`, method: 'put' })
}
