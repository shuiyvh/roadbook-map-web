import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripPreferenceSourceRel, TripPreferenceSourceRelQuery } from '@/types/api/trip/adminConfig'

export function listPreferenceSourceRels(query: TripPreferenceSourceRelQuery): Promise<TableDataInfo<TripPreferenceSourceRel>> {
  return request({ url: '/trip/admin/preference-source-rel/page', method: 'get', params: query })
}
export function getPreferenceSourceRel(id: number): Promise<AjaxResult<TripPreferenceSourceRel>> {
  return request({ url: `/trip/admin/preference-source-rel/${id}`, method: 'get' })
}
export function addPreferenceSourceRel(data: TripPreferenceSourceRel): Promise<AjaxResult> {
  return request({ url: '/trip/admin/preference-source-rel', method: 'post', data })
}
export function updatePreferenceSourceRel(data: TripPreferenceSourceRel): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preference-source-rel/${data.id}`, method: 'put', data })
}
export function deletePreferenceSourceRel(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preference-source-rel/${id}`, method: 'delete' })
}
export function togglePreferenceSourceRel(id: number, enabled: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preference-source-rel/${id}/enabled/${enabled}`, method: 'put' })
}
