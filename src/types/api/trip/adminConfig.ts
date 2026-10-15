import type { BaseEntity, PageDomain } from '@/types/api/common'

export interface TripPreferenceQuery extends PageDomain {
  prefCode?: string
  prefName?: string
  enabled?: number
}

export interface TripPreference extends BaseEntity {
  id?: number
  prefCode?: string
  prefName?: string
  description?: string
  weight?: number
  enabled?: number
  sortOrder?: number
}

export interface TripSearchSourceQuery extends PageDomain {
  sourceName?: string
  sourceCode?: string
  platformType?: string
  enabled?: number
}

export interface TripSearchSource extends BaseEntity {
  id?: number
  sourceName?: string
  sourceCode?: string
  domain?: string
  platformType?: string
  weight?: number
  enabled?: number
  sortOrder?: number
}

export interface TripSearchTemplateQuery extends PageDomain {
  prefCode?: string
  templateName?: string
  enabled?: number
}

export interface TripSearchTemplate extends BaseEntity {
  id?: number
  prefCode?: string
  templateName?: string
  templateContent?: string
  enabled?: number
  sortOrder?: number
}

export interface TripPreferenceSourceRelQuery extends PageDomain {
  prefCode?: string
  sourceCode?: string
  enabled?: number
}

export interface TripPreferenceSourceRel extends BaseEntity {
  id?: number
  prefCode?: string
  sourceCode?: string
  weight?: number
  enabled?: number
}

export interface TripThirdConfigQuery extends PageDomain {
  configType?: string
  enabled?: number
}

export interface TripThirdConfig extends BaseEntity {
  id?: number
  configType?: string
  configKey?: string
  configValue?: string
  encrypted?: number
  enabled?: number
  remark?: string
}
