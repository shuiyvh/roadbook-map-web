import request from '@/utils/request'
import type { AjaxResult, TableDataInfo } from '@/types/api/common'
import type { TripThirdConfig, TripThirdConfigQuery } from '@/types/api/trip/adminConfig'

/** 分页查询三方配置（敏感值列表脱敏） */
export function listThirdConfigs(query: TripThirdConfigQuery): Promise<TableDataInfo<TripThirdConfig>> {
  return request({ url: '/trip/admin/third-config/page', method: 'get', params: query })
}

/** 查询配置详情（返回明文，供编辑回显） */
export function getThirdConfig(id: number): Promise<AjaxResult<TripThirdConfig>> {
  return request({ url: `/trip/admin/third-config/${id}`, method: 'get' })
}

/** 新增三方配置 */
export function addThirdConfig(data: TripThirdConfig): Promise<AjaxResult> {
  return request({ url: '/trip/admin/third-config', method: 'post', data })
}

/** 修改三方配置 */
export function updateThirdConfig(data: TripThirdConfig): Promise<AjaxResult> {
  return request({ url: '/trip/admin/third-config', method: 'put', data })
}

/** 删除三方配置 */
export function deleteThirdConfig(id: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/third-config/${id}`, method: 'delete' })
}

/** 启用/停用三方配置 */
export function toggleThirdConfig(id: number, enabled: number): Promise<AjaxResult> {
  return request({ url: `/trip/admin/third-config/${id}/enabled`, method: 'put', data: { enabled } })
}