export interface TripJourneyStartRequest {
  routebookId: number
  lng?: number
  lat?: number
  clientType?: string
}

export interface TripJourneyLocationRequest {
  journeyId: number
  lng: number
  lat: number
  accuracy?: number
  clientType?: string
  userAgent?: string
}

export interface TripJourneyCheckinRequest {
  journeyId: number
  pointId?: number
  lng?: number
  lat?: number
  checkinType?: string
  remark?: string
}

export interface TripJourneyPointRequest {
  journeyId: number
  pointId?: number
  reason?: string
}

export interface TripJourneyDetail {
  id?: number
  routebookId?: number
  userId?: number
  status?: string
  currentPointId?: number
  currentPointOrder?: number
  totalCheckinCount?: number
  totalSkipCount?: number
  startedAt?: string
  finishedAt?: string
  points?: Array<Record<string, unknown>>
  [key: string]: unknown
}
