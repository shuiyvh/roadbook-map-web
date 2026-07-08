# 摩旅与旅游智能路书前端对接文档

生成日期：2026-07-07

## 1. 通用约定

1. 后端接口沿用若依返回结构，普通接口返回 `AjaxResult`，分页接口返回 `TableDataInfo`。
2. 登录态接口需要携带若依 Token，并受 `@PreAuthorize` 权限码控制。
3. 分页接口按若依约定传 `pageNum`、`pageSize`，其余查询字段按对应业务实体字段传递。
4. 大屏工作台接口统一前缀为 `/trip/screen`。
5. 后台配置与日志接口统一前缀为 `/trip/admin`。
6. 分享页和邀请页存在公开访问接口，不需要登录；接受邀请需要登录。

## 2. 前端功能清单

### 2.1 PC 路书地图工作台

1. 路书分页、详情、新建、编辑、删除、复制、发布、归档。
2. 地图展示路书点位和分段路线。
3. POI 搜索、POI 详情查看、地图选点加入路书。
4. 点位列表管理：新增、编辑、删除、拖拽排序。
5. 每日行程拆分：批量设置点位所属天数。
6. 分段路线查询与重算。
7. 推荐搜索、推荐列表、AI 摘要重生成、推荐加入路书。
8. GPX / KML 导出。
9. 路书模板列表、设为模板、取消模板、从模板创建路书。
10. 点位评论列表、新增、编辑、删除。
11. 天气与风险提醒展示。

### 2.2 H5 出行页

1. 路书分享详情查看。
2. 开始出行。
3. 出行详情查看，展示当前目标点、已打卡点和待打卡点。
4. 当前定位匹配目标点。
5. 唤起高德地图分段导航。
6. 到点打卡、手动打卡。
7. 跳过点位、撤销打卡、调整当前目标点。
8. 结束出行、取消出行。

### 2.3 分享与邀请

1. 创建分享链接、分享列表、禁用分享链接。
2. 公开分享页根据分享码查看路书。
3. 创建邀请链接、邀请列表、禁用邀请链接。
4. 公开邀请页查看邀请信息。
5. 登录后接受邀请，写入路书成员。

### 2.4 后台配置与日志

1. 推荐偏好 CRUD、启停、启用列表。
2. 搜索站点 CRUD、启停、启用列表。
3. 偏好站点绑定 CRUD、启停、按偏好查询启用绑定。
4. Tavily 搜索模板 CRUD、启停、按偏好查询启用模板。
5. 业务审计日志分页和详情。
6. 第三方调用日志分页和详情。

## 3. PC 大屏接口

### 3.1 路书

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 路书分页 | GET | `/trip/screen/routebooks/page` | 路书查询字段、`pageNum`、`pageSize` | `trip:routebook:list` |
| 路书详情 | GET | `/trip/screen/routebooks/{id}` | 路书ID | `trip:routebook:query` |
| 新建路书 | POST | `/trip/screen/routebooks` | `TripRoutebook` | `trip:routebook:add` |
| 编辑路书 | PUT | `/trip/screen/routebooks/{id}` | `TripRoutebook` | `trip:routebook:edit` |
| 删除路书 | DELETE | `/trip/screen/routebooks/{id}` | 路书ID | `trip:routebook:remove` |
| 复制路书 | POST | `/trip/screen/routebooks/{id}/copy` | 路书ID | `trip:routebook:copy` |
| 发布路书 | POST | `/trip/screen/routebooks/{id}/publish` | 路书ID | `trip:routebook:publish` |
| 归档路书 | POST | `/trip/screen/routebooks/{id}/archive` | 路书ID | `trip:routebook:archive` |
| 导出 GPX | GET | `/trip/screen/routebooks/{id}/export/gpx` | 路书ID | `trip:routebook:query` |
| 导出 KML | GET | `/trip/screen/routebooks/{id}/export/kml` | 路书ID | `trip:routebook:query` |

### 3.2 路书模板

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 模板分页 | GET | `/trip/screen/routebook-templates/page` | 模板查询字段、`pageNum`、`pageSize` | `trip:routebook:list` |
| 设为模板 | POST | `/trip/screen/routebooks/{id}/template` | `TripRoutebookTemplateRequest` | `trip:routebook:edit` |
| 取消模板 | DELETE | `/trip/screen/routebooks/{id}/template` | 路书ID | `trip:routebook:edit` |
| 从模板创建 | POST | `/trip/screen/routebook-templates/{id}/create` | `TripRoutebookTemplateRequest` | `trip:routebook:copy` |

### 3.3 点位

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 点位列表 | GET | `/trip/screen/routebooks/{routebookId}/points` | 路书ID | `trip:point:list` |
| 新增点位 | POST | `/trip/screen/routebooks/{routebookId}/points` | `TripRoutebookPoint` | `trip:point:add` |
| 编辑点位 | PUT | `/trip/screen/routebooks/{routebookId}/points/{pointId}` | `TripRoutebookPoint` | `trip:point:edit` |
| 删除点位 | DELETE | `/trip/screen/routebooks/{routebookId}/points/{pointId}` | 路书ID、点位ID | `trip:point:remove` |
| 点位排序 | PUT | `/trip/screen/routebooks/{routebookId}/points/sort` | `List<TripRoutebookPoint>` | `trip:point:edit` |
| 每日行程拆分 | PUT | `/trip/screen/routebooks/{routebookId}/points/day-plan` | `TripRoutebookDayPlanRequest` | `trip:point:edit` |

### 3.4 分段路线

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 分段路线列表 | GET | `/trip/screen/routebooks/{routebookId}/segments` | 路书ID | `trip:segment:list` |
| 重算分段路线 | POST | `/trip/screen/routebooks/{routebookId}/segments/recalculate` | 路书ID | `trip:segment:recalculate` |

### 3.5 地图服务

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| POI 搜索 | GET | `/trip/screen/map/poi/search` | `AmapPoiSearchRequest` 查询参数 | `trip:map:poi` |
| POI 详情 | GET | `/trip/screen/map/poi/detail` | `AmapPoiDetailRequest` 查询参数 | `trip:map:poi` |
| 路线规划 | POST | `/trip/screen/map/route/plan` | `AmapRoutePlanRequest` | `trip:map:route` |
| 导航 URI | POST | `/trip/screen/map/navigation-uri` | `AmapNavigationUriRequest` | `trip:map:navigation` |

### 3.6 推荐

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 推荐搜索 | POST | `/trip/screen/recommend/search` | `TripRecommendSearchRequest` | `trip:recommend:search` |
| 推荐列表 | GET | `/trip/screen/recommend/list` | 推荐查询字段、`pageNum`、`pageSize` | `trip:recommend:list` |
| AI 重新生成 | POST | `/trip/screen/recommend/{id}/ai` | 推荐ID | `trip:recommend:ai` |
| 推荐加入路书 | POST | `/trip/screen/recommend/{id}/add-to-routebook` | `TripRecommendAddPointRequest` | `trip:recommend:addToRoutebook` |

### 3.7 点位评论

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 评论列表 | GET | `/trip/screen/routebooks/{routebookId}/points/{pointId}/comments` | 路书ID、点位ID | `trip:point:list` |
| 新增评论 | POST | `/trip/screen/routebooks/{routebookId}/points/{pointId}/comments` | `TripPointComment` | `trip:point:add` |
| 编辑评论 | PUT | `/trip/screen/routebooks/{routebookId}/points/{pointId}/comments/{commentId}` | `TripPointComment` | `trip:point:edit` |
| 删除评论 | DELETE | `/trip/screen/routebooks/{routebookId}/points/{pointId}/comments/{commentId}` | 路书ID、点位ID、评论ID | `trip:point:remove` |

### 3.8 风险提醒

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 天气与风险提醒 | POST | `/trip/screen/risk/reminders` | `TripRiskReminderRequest` | `trip:routebook:query` |

## 4. 分享与邀请接口

### 4.1 分享

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 创建分享 | POST | `/trip/share/create` | `TripShareCreateRequest` | `trip:share:create` |
| 分享列表 | GET | `/trip/share/list` | 分享查询字段、`pageNum`、`pageSize` | `trip:share:list` |
| 禁用分享 | POST | `/trip/share/disable` | `TripShareViewRequest` | `trip:share:disable` |
| 公开分享详情 | GET / POST | `/s/{shareCode}` | 分享码，必要时传访问密码 | 公开接口 |

### 4.2 邀请

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 创建邀请 | POST | `/trip/invite/create` | `TripInviteCreateRequest` | `trip:invite:create` |
| 邀请列表 | GET | `/trip/invite/list` | 邀请查询字段、`pageNum`、`pageSize` | `trip:invite:list` |
| 禁用邀请 | POST | `/trip/invite/disable` | 邀请ID或邀请码参数 | `trip:invite:disable` |
| 公开邀请详情 | GET | `/invite/{inviteCode}` | 邀请码 | 公开接口 |
| 接受邀请 | POST | `/invite/{inviteCode}/accept` | 邀请码 | 登录接口 |

## 5. H5 出行接口

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 开始出行 | POST | `/trip/journey/start` | `TripJourneyStartRequest` | `trip:journey:start` |
| 出行详情 | GET | `/trip/journey/{journeyId}` | 出行ID | `trip:journey:query` |
| 定位匹配 | POST | `/trip/journey/location/match` | `TripJourneyLocationRequest` | `trip:journey:match` |
| 当前目标导航 URI | POST | `/trip/journey/navigation-uri` | `TripJourneyNavigationRequest` | `trip:journey:navigation` |
| 打卡 | POST | `/trip/journey/checkin` | `TripJourneyCheckinRequest` | `trip:journey:checkin` |
| 跳过点位 | POST | `/trip/journey/skip-point` | `TripJourneyPointRequest` | `trip:journey:skip` |
| 撤销打卡 | POST | `/trip/journey/undo-checkin` | `TripJourneyPointRequest` | `trip:journey:edit` |
| 调整当前目标 | POST | `/trip/journey/set-current-point` | `TripJourneyPointRequest` | `trip:journey:edit` |
| 结束出行 | POST | `/trip/journey/finish` | `TripJourneyPointRequest` | `trip:journey:finish` |
| 取消出行 | POST | `/trip/journey/cancel` | `TripJourneyPointRequest` | `trip:journey:cancel` |

## 6. 后台配置接口

### 6.1 推荐偏好

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 分页 | GET | `/trip/admin/preferences/page` | 查询字段、`pageNum`、`pageSize` | `trip:preference:list` |
| 启用列表 | GET | `/trip/admin/preferences/enabled` | 无 | `trip:preference:list` |
| 详情 | GET | `/trip/admin/preferences/{id}` | 偏好ID | `trip:preference:query` |
| 新增 | POST | `/trip/admin/preferences` | `TripPreference` | `trip:preference:add` |
| 编辑 | PUT | `/trip/admin/preferences/{id}` | `TripPreference` | `trip:preference:edit` |
| 删除 | DELETE | `/trip/admin/preferences/{id}` | 偏好ID | `trip:preference:remove` |
| 启停 | PUT | `/trip/admin/preferences/{id}/enabled/{enabled}` | 偏好ID、启停状态 | `trip:preference:edit` |

### 6.2 搜索站点

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 分页 | GET | `/trip/admin/search-sources/page` | 查询字段、`pageNum`、`pageSize` | `trip:searchSource:list` |
| 启用列表 | GET | `/trip/admin/search-sources/enabled` | 无 | `trip:searchSource:list` |
| 详情 | GET | `/trip/admin/search-sources/{id}` | 站点ID | `trip:searchSource:query` |
| 新增 | POST | `/trip/admin/search-sources` | `TripSearchSource` | `trip:searchSource:add` |
| 编辑 | PUT | `/trip/admin/search-sources/{id}` | `TripSearchSource` | `trip:searchSource:edit` |
| 删除 | DELETE | `/trip/admin/search-sources/{id}` | 站点ID | `trip:searchSource:remove` |
| 启停 | PUT | `/trip/admin/search-sources/{id}/enabled/{enabled}` | 站点ID、启停状态 | `trip:searchSource:edit` |

### 6.3 偏好站点绑定

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 分页 | GET | `/trip/admin/preference-source-rel/page` | 查询字段、`pageNum`、`pageSize` | `trip:preferenceSourceRel:list` |
| 按偏好查启用绑定 | GET | `/trip/admin/preference-source-rel/enabled/{prefCode}` | 偏好编码 | `trip:preferenceSourceRel:list` |
| 详情 | GET | `/trip/admin/preference-source-rel/{id}` | 绑定ID | `trip:preferenceSourceRel:query` |
| 新增 | POST | `/trip/admin/preference-source-rel` | `TripPreferenceSourceRel` | `trip:preferenceSourceRel:add` |
| 编辑 | PUT | `/trip/admin/preference-source-rel/{id}` | `TripPreferenceSourceRel` | `trip:preferenceSourceRel:edit` |
| 删除 | DELETE | `/trip/admin/preference-source-rel/{id}` | 绑定ID | `trip:preferenceSourceRel:remove` |
| 启停 | PUT | `/trip/admin/preference-source-rel/{id}/enabled/{enabled}` | 绑定ID、启停状态 | `trip:preferenceSourceRel:edit` |

### 6.4 搜索模板

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 分页 | GET | `/trip/admin/search-templates/page` | 查询字段、`pageNum`、`pageSize` | `trip:searchTemplate:list` |
| 按偏好查启用模板 | GET | `/trip/admin/search-templates/enabled/{prefCode}` | 偏好编码 | `trip:searchTemplate:list` |
| 详情 | GET | `/trip/admin/search-templates/{id}` | 模板ID | `trip:searchTemplate:query` |
| 新增 | POST | `/trip/admin/search-templates` | `TripSearchTemplate` | `trip:searchTemplate:add` |
| 编辑 | PUT | `/trip/admin/search-templates/{id}` | `TripSearchTemplate` | `trip:searchTemplate:edit` |
| 删除 | DELETE | `/trip/admin/search-templates/{id}` | 模板ID | `trip:searchTemplate:remove` |
| 启停 | PUT | `/trip/admin/search-templates/{id}/enabled/{enabled}` | 模板ID、启停状态 | `trip:searchTemplate:edit` |

## 7. 后台日志接口

| 功能 | 方法 | 路径 | 请求体 / 参数 | 权限 |
| --- | --- | --- | --- | --- |
| 审计日志分页 | GET | `/trip/admin/audit-logs/page` | 查询字段、`pageNum`、`pageSize` | `trip:audit:list` |
| 审计日志详情 | GET | `/trip/admin/audit-logs/{id}` | 日志ID | `trip:audit:query` |
| 调用日志分页 | GET | `/trip/admin/call-logs/page` | 查询字段、`pageNum`、`pageSize` | `trip:callLog:list` |
| 调用日志详情 | GET | `/trip/admin/call-logs/{id}` | 日志ID | `trip:callLog:query` |

## 8. 前端建议文件拆分

1. `src/api/trip/routebook.ts`：路书、模板、导出。
2. `src/api/trip/point.ts`：点位、排序、每日行程、评论。
3. `src/api/trip/segment.ts`：分段路线。
4. `src/api/trip/map.ts`：POI、路线规划、导航 URI。
5. `src/api/trip/recommend.ts`：推荐搜索和 AI。
6. `src/api/trip/share.ts`：分享。
7. `src/api/trip/invite.ts`：邀请。
8. `src/api/trip/journey.ts`：H5 出行。
9. `src/api/trip/admin.ts`：后台配置和日志。

## 9. 待前端确认

1. 前端工程目录和技术栈版本。
2. PC 大屏工作台路由与页面命名。
3. H5 页面是否复用同一前端工程，还是单独 H5 工程。
4. GPX / KML 下载是否由浏览器直接处理附件响应。
5. 分享页访问密码交互方式。
6. 路书成员角色权限在前端的按钮隐藏策略。
