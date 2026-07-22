# 路书业务字典前端映射清单

对应初始化脚本：`docs/db/trip_business_dict_20260722.sql`

| 业务对象/接口字段 | 字典类型 | 说明 |
| --- | --- | --- |
| `TripRoutebook.status` | `trip_routebook_status` | 路书状态 |
| `TripRoutebook.visibility` | `trip_routebook_visibility` | 路书可见性 |
| `TripRoutebook.routeMode` | `trip_route_mode` | 路线模式 |
| `TripRoutebook.templateFlag` | `trip_template_flag` | 是否模板 |
| `TripRoutebookPoint.pointType` | `trip_point_type` | 路书点位类型 |
| `TripRoutebookPoint.source` | `trip_point_source` | 路书点位来源 |
| `TripJourney.status` | `trip_journey_status` | 出行实例状态 |
| `TripJourneyPoint.status` | `trip_journey_point_status` | 出行点位进度状态 |
| `TripJourneyPoint.checkinType` | `trip_checkin_type` | 打卡方式 |
| `TripJourneyLocationLog.matchType` | `trip_location_match_type` | 定位匹配类型 |
| `TripJourneyLocationLog.clientType` | `trip_client_type` | 客户端类型，代码透传调用端值 |
| `TripJourneyMatchVo.matchType` | `trip_location_match_type` | 出行匹配结果类型 |
| `TripJourneyStartRequest.clientType` | `trip_client_type` | 创建出行时的客户端类型 |
| `TripJourneyLocationRequest.clientType` | `trip_client_type` | 定位匹配时的客户端类型 |
| `TripShareLink.shareType` | `trip_share_type` | 分享链接类型 |
| `TripShareLink.enabled` | `trip_enabled_status` | 分享链接启停状态 |
| `TripInviteLink.roleCode` | `trip_routebook_role` | 邀请角色 |
| `TripInviteLink.enabled` | `trip_enabled_status` | 邀请链接启停状态 |
| `TripRoutebookMember.roleCode` | `trip_routebook_role` | 成员角色 |
| `TripRoutebookMember.joinSource` | `trip_member_join_source` | 成员加入来源 |
| `TripPreference.enabled` | `trip_enabled_status` | 偏好启停状态 |
| `TripPreferenceSourceRel.enabled` | `trip_enabled_status` | 偏好站点绑定启停状态 |
| `TripSearchSource.platformType` | `trip_search_source_platform` | 搜索站点平台类型 |
| `TripSearchSource.enabled` | `trip_enabled_status` | 搜索站点启停状态 |
| `TripSearchTemplate.enabled` | `trip_enabled_status` | 搜索模板启停状态 |
| `TripTavilySearchRecord.searchDepth` | `trip_tavily_search_depth` | Tavily 搜索深度 |
| `TripTavilySearchRecord.success` | `trip_success_flag` | 是否调用成功，`1` 成功、`0` 失败 |
| `TripExternalCallLog.provider` | `trip_external_provider` | 第三方服务提供方 |
| `TripExternalCallLog.callType` | `trip_external_call_type` | 第三方调用类型 |
| `TripExternalCallLog.businessType` | `trip_external_business_type` | 第三方调用业务类型 |
| `TripExternalCallLog.resultStatus` | `trip_call_result_status` | 第三方调用结果 |
| `TripAuditLog.operationType` | `trip_audit_operation_type` | 审计操作类型 |
| `TripAuditLog.businessType` | `trip_audit_business_type` | 审计业务类型 |
| `TripAuditLog.resultStatus` | `trip_call_result_status` | 审计结果 |
| `TripAuditLog.clientType` | `trip_client_type` | 客户端类型，代码透传调用端值 |
| `TripRiskReminderVo.RiskItem.level` | `trip_risk_level` | 风险等级 |
| `TripRiskReminderVo.RiskItem.riskType` | `trip_risk_type` | 风险类型 |
| `TripDashboardDistributionVo.typeCode` | `trip_point_type` | 首页点位类型分布 |
| `TripDashboardDistributionVo.status` | `trip_journey_status` | 首页出行状态分布 |
