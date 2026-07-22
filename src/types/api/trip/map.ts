export interface PoiSearchQuery {
  keywords: string
  types?: string
  region?: string
  cityLimit?: boolean
  showFields?: string
  pageSize?: number
  pageNum?: number
}

export interface PoiItem {
  id?: string
  name?: string
  address?: string
  type?: string
  location?: string
  distance?: string
  [key: string]: unknown
}

export interface AmapRoutePlanRequest {
  originLng: number
  originLat: number
  destinationLng: number
  destinationLat: number
  strategy?: string
  showFields?: string
}

export interface AmapNavigationUriRequest {
  fromLng?: number
  fromLat?: number
  fromName?: string
  toLng: number
  toLat: number
  toName?: string
  mode?: string
  policy?: string
}
