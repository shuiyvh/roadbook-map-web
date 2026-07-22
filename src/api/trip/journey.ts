import request from '@/utils/request'
import type { AjaxResult } from '@/types/api/common'
import type { TripJourneyCheckinRequest, TripJourneyDetail, TripJourneyLocationRequest, TripJourneyPointRequest, TripJourneyStartRequest } from '@/types/api/trip/journeyBusiness'

export function startJourney(data: TripJourneyStartRequest): Promise<AjaxResult<TripJourneyDetail>> {
  return request({ url: '/trip/journey/start', method: 'post', data })
}
export function getJourney(id: number): Promise<AjaxResult<TripJourneyDetail>> {
  return request({ url: `/trip/journey/${id}`, method: 'get' })
}
export function matchJourneyLocation(data: TripJourneyLocationRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/location/match', method: 'post', data })
}
export function checkinJourneyPoint(data: TripJourneyCheckinRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/checkin', method: 'post', data })
}
export function skipJourneyPoint(data: TripJourneyPointRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/skip-point', method: 'post', data })
}
export function undoJourneyCheckin(data: TripJourneyPointRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/undo-checkin', method: 'post', data })
}
export function setCurrentJourneyPoint(data: TripJourneyPointRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/set-current-point', method: 'post', data })
}
export function finishJourney(data: TripJourneyPointRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/finish', method: 'post', data })
}
export function cancelJourney(data: TripJourneyPointRequest): Promise<AjaxResult> {
  return request({ url: '/trip/journey/cancel', method: 'post', data })
}
