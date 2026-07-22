import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripPreference, TripPreferenceQuery } from '@/types/api/trip/adminConfig'

export function listPreferences(query: TripPreferenceQuery): Promise<TableDataInfo<TripPreference>> {
  return request({ url: '/trip/admin/preferences/page', method: 'get', params: query })
}

export function getPreference(id: number): Promise<AjaxResult<TripPreference>> {
  return request({ url: `/trip/admin/preferences/${id}`, method: 'get' })
}

export function addPreference(data: TripPreference): Promise<AjaxResult> {
  return request({ url: '/trip/admin/preferences', method: 'post', data })
}

export function updatePreference(data: TripPreference): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preferences/${data.id}`, method: 'put', data })
}

export function deletePreference(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preferences/${id}`, method: 'delete' })
}

export function togglePreference(id: number, enabled: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/preferences/${id}/enabled/${enabled}`, method: 'put' })
}
