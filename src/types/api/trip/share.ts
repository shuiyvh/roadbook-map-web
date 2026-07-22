export interface TripShareCreateRequest {
  routebookId: number
  shareType: string
  password?: string
  expireTime?: string
}

export interface TripShareLink {
  id?: number
  routebookId?: number
  shareCode?: string
  shareType?: string
  expireTime?: string
  enabled?: number
  viewCount?: number
  lastViewTime?: string
  createTime?: string
}

export interface TripInviteCreateRequest {
  routebookId: number
  roleCode: string
  maxUseCount?: number
  expireTime?: string
}

export interface TripInviteLink {
  id?: number
  routebookId?: number
  inviteCode?: string
  roleCode?: string
  maxUseCount?: number
  usedCount?: number
  expireTime?: string
  enabled?: number
  createTime?: string
}
