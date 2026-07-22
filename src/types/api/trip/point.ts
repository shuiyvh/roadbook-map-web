import type { BaseEntity } from '@/types/api/common'

/** 路书中的一个有序点位。 */
export interface TripRoutebookPoint extends BaseEntity {
  id?: number
  routebookId?: number
  pointName?: string
  pointType?: string
  amapPoiId?: string
  lng?: number
  lat?: number
  address?: string
  cityCode?: string
  adCode?: string
  sortOrder?: number
  dayNo?: number
  stayMinutes?: number
  checkinRadiusM?: number
  source?: string
  extraInfo?: string
  deleted?: number
}

/** 相邻点位间由后端计算得到的路线分段。 */
export interface TripRoutebookSegment extends BaseEntity {
  id?: number
  routebookId?: number
  fromPointId?: number
  toPointId?: number
  sortOrder?: number
  dayNo?: number
  distanceM?: number
  durationS?: number
  polyline?: string
  tolls?: number
  trafficLights?: number
  routePolicy?: string
  rawResponse?: string
}
