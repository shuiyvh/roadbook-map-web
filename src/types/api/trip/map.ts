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

/** 高德地理编码请求：地址转经纬度。 */
export interface AmapGeocodeQuery {
  address: string
  city?: string
}

/** 高德逆地理编码请求：经纬度转地址。 */
export interface AmapRegeoQuery {
  lng: number
  lat: number
  radius?: number
}
