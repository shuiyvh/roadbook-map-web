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

/** 分享页路书公开字段（后端 TripShareRoutebookVo，仅含公开字段） */
export interface TripShareRoutebookVo {
  routebookId?: number
  title?: string
  description?: string
  coverUrl?: string
  startName?: string
  endName?: string
  totalDistanceM?: number
  totalDurationS?: number
}

/** 邀请页公开信息（后端 TripInviteInfoVo） */
export interface TripInviteInfoVo {
  routebookId?: number
  routebookTitle?: string
  roleCode?: string
  maxUseCount?: number
  usedCount?: number
  expireTime?: string
}

/** 路书成员记录（后端 TripRoutebookMember） */
export interface TripRoutebookMember {
  id?: number
  routebookId?: number
  userId?: number
  roleCode?: string
  joinSource?: string
  inviteLinkId?: number
  createTime?: string
}
