import type { BaseEntity, PageDomain } from '@/types/api/common'

/** 路书分页查询条件。 */
export interface TripRoutebookQuery extends PageDomain {
  title?: string
  status?: string
  ownerUserId?: number
  visibility?: string
  routeMode?: string
  templateFlag?: number
}

/** 首页及路书列表当前使用的路书基础字段。 */
export interface TripRoutebook extends BaseEntity {
  id?: number
  title?: string
  description?: string
  coverUrl?: string
  startName?: string
  endName?: string
  totalDistanceM?: number
  totalDurationS?: number
  status?: string
  visibility?: string
  ownerUserId?: number
  routeMode?: string
  routePolicy?: string
  templateFlag?: number
  templateName?: string
  templateRemark?: string
  preferenceSnapshot?: string
  extraInfo?: string
}

export interface TripRoutebookTemplateRequest {
  templateName?: string
  templateRemark?: string
  title?: string
}

/** 路书下拉选项。 */
export interface TripRoutebookOption {
  id: number
  title: string
}
