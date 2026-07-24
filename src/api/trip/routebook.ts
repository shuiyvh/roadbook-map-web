import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripRoutebook, TripRoutebookOption, TripRoutebookQuery, TripRoutebookTemplateRequest } from '@/types/api/trip/routebook'

/** 查询大屏路书分页列表。 */
export function listRoutebooks(query: TripRoutebookQuery): Promise<TableDataInfo<TripRoutebook>> {
  return request({
    url: '/trip/screen/routebooks/page',
    method: 'get',
    params: query
  })
}

/** 查询路书下拉选项，供所有路书 ID 选择场景统一使用。 */
export function listRoutebookOptions(): Promise<AjaxResult<TripRoutebookOption[]>> {
  return request({ url: '/trip/screen/routebooks/options', method: 'get' })
}

export function getRoutebook(id: number): Promise<AjaxResult<TripRoutebook>> {
  return request({ url: `/trip/screen/routebooks/${id}`, method: 'get' })
}

export function addRoutebook(data: TripRoutebook): Promise<AjaxResult<number | TripRoutebook>> {
  return request({ url: '/trip/screen/routebooks', method: 'post', data })
}

export function updateRoutebook(data: TripRoutebook): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${data.id}`, method: 'put', data })
}

export function deleteRoutebook(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${id}`, method: 'delete' })
}

export function copyRoutebook(id: number): Promise<AjaxResult<number | TripRoutebook>> {
  return request({ url: `/trip/screen/routebooks/${id}/copy`, method: 'post' })
}

export function publishRoutebook(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${id}/publish`, method: 'post' })
}

export function archiveRoutebook(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${id}/archive`, method: 'post' })
}

export function markRoutebookTemplate(id: number, data: TripRoutebookTemplateRequest): Promise<AjaxResult> {
  return request({ url: `/trip/screen/routebooks/${id}/template`, method: 'post', data })
}
