import type { BaseEntity, PageDomain } from '@/types/api/common'

/** 推荐结果分页查询条件。 */
export interface TripRecommendQuery extends PageDomain {
  routebookId?: number
  pointId?: number
  userId?: number
  prefCode?: string
  queryText?: string
  title?: string
}

/** 推荐结果基础字段。 */
export interface TripRecommend extends BaseEntity {
  id?: number
  routebookId?: number
  pointId?: number
  title?: string
  sourceUrl?: string
  sourceDomain?: string
  contentSnippet?: string
  tavilyScore?: number
  ruleScore?: number
  aiScore?: number
  finalScore?: number
  aiSummary?: string
  recommendReason?: string
  riskNotice?: string
}

export interface TripRecommendSearchRequest {
  routebookId?: number
  pointId?: number
  prefCode?: string
  queryText: string
  includeDomains?: string[]
  excludeDomains?: string[]
  searchDepth?: 'basic' | 'advanced'
  maxResults?: number
}

export interface TripRecommendAddPointRequest {
  pointName?: string
  pointType?: string
  amapPoiId?: string
  lng?: number
  lat?: number
  address?: string
  cityCode?: string
  adCode?: string
  sortOrder?: number
  stayMinutes?: number
  remark?: string
  checkinRadiusM?: number
}
