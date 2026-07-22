import request from '@/utils/request'
import type { DashboardOverviewQuery, DashboardOverviewResult } from '@/types/api/trip/dashboard'

/** 查询首页聚合统计数据。 */
export function getDashboardOverview(query: DashboardOverviewQuery = {}): Promise<DashboardOverviewResult> {
  return request({
    url: '/trip/screen/dashboard/overview',
    method: 'get',
    params: query
  })
}
