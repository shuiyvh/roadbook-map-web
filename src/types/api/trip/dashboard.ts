import type { AjaxResult } from '@/types/api/common'

/** 首页统计查询条件。 */
export interface DashboardOverviewQuery {
  /** 统计天数，后端支持 7-30 天。 */
  days?: number
}

/** 首页核心指标。 */
export interface DashboardSummary {
  routebookTotal?: number
  routebookChange?: number | null
  pointTotal?: number
  pointChange?: number | null
  recommendationTotal?: number
  recommendationChange?: number | null
  activeJourneyTotal?: number
  activeJourneyChange?: number | null
}

/** 按自然日聚合的路书活跃数据。 */
export interface DashboardTrendItem {
  date: string
  newRoutebookCount: number
  publishedRoutebookCount: number
  startedJourneyCount: number
}

/** 热门路书。 */
export interface DashboardPopularRoutebook {
  routebookId: number
  title?: string
  coverUrl?: string
  totalDistanceM?: number
  pointCount?: number
  heatValue?: number
}

/** 点位类型统计。 */
export interface DashboardPointTypeDistribution {
  typeCode: string
  typeName: string
  count: number
}

/** 出行状态统计。 */
export interface DashboardJourneyStatusDistribution {
  status: string
  statusName: string
  count: number
}

/** 首页聚合统计数据。字段缺失表示当前账号没有对应模块权限。 */
export interface DashboardOverview {
  summary?: DashboardSummary
  trend?: DashboardTrendItem[]
  popularRoutebooks?: DashboardPopularRoutebook[]
  pointTypeDistribution?: DashboardPointTypeDistribution[]
  journeyStatusDistribution?: DashboardJourneyStatusDistribution[]
  warnings?: string[]
}

/** 首页统计响应，兼容后端将部分失败提示放在响应顶层的情况。 */
export interface DashboardOverviewResult extends AjaxResult<DashboardOverview> {
  warnings?: string[]
}
