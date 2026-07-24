# 路书大屏接口联调结果与后端需求

生成日期：2026-07-24

## 0. 前端业务边界

根据《摩旅与旅游智能路书系统设计文档》第 4、6.1、7.1、9.1 节：

1. PC 大屏地图工作台负责路书创建、我的路书查询、详情、编辑、删除、复制、发布和归档。
2. 用户创建路书后应继续留在大屏，通过 POI 搜索、点位配置、顺序调整和路线重算完成规划。
3. 后台只负责高德、Tavily、AI、偏好标签、搜索站点、搜索模板和审计日志等配置，不承载普通用户的大屏路书操作。
4. 前后端接口虽然可以复用现有 `/trip/screen/routebooks/**`，但大屏交互与后台管理交互必须保持独立。

## 1. 本次已接入接口

| 大屏功能 | 接口 | 接入结果 |
| --- | --- | --- |
| 默认路书 | `GET /trip/screen/routebooks/page` | 未传 `routebookId` 时读取当前账号最近更新的一条路书 |
| 我的路书 | `GET /trip/screen/routebooks/page` | 在大屏抽屉内分页展示、选择和切换当前路书 |
| 创建路书 | `POST /trip/screen/routebooks` | 在大屏创建草稿，创建后直接进入地图点位规划 |
| 路书详情 | `GET /trip/screen/routebooks/{id}` | 标题、状态、更新时间、描述、起终点、总里程、预计用时 |
| 删除路书 | `DELETE /trip/screen/routebooks/{id}` | 在大屏“我的路书”中确认后删除并切换下一条 |
| 复制路书 | `POST /trip/screen/routebooks/{id}/copy` | 在大屏复制并切换到新副本 |
| 归档路书 | `POST /trip/screen/routebooks/{id}/archive` | 在大屏归档指定路书 |
| 路线节点 | `GET /trip/screen/routebooks/{routebookId}/points` | 按 `sortOrder` 展示节点，并按坐标绘制地图标记 |
| 修改点位 | `PUT /trip/screen/routebooks/{routebookId}/points/{pointId}` | 在大屏配置点位名称、类型、天数、停留时间、打卡半径和备注 |
| 删除点位 | `DELETE /trip/screen/routebooks/{routebookId}/points/{pointId}` | 删除后重新读取并绘制路线 |
| 点位排序 | `PUT /trip/screen/routebooks/{routebookId}/points/sort` | 在大屏调整顺序后保存，并触发路线重算 |
| 分段路线 | `GET /trip/screen/routebooks/{routebookId}/segments` | 优先使用 `polyline` 绘制真实道路；接口失败或单段缺失时直线降级 |
| 修改路书 | `PUT /trip/screen/routebooks/{id}` | 编辑标题后通过“保存”提交 |
| 发布路书 | `POST /trip/screen/routebooks/{id}/publish` | 发布成功后重新读取详情和状态 |
| POI 搜索 | `GET /trip/screen/map/poi/search` | 大屏进入地图选点模式后搜索，高德 POI 结果直接显示为地图临时标记 |
| 新增点位 | `POST /trip/screen/routebooks/{routebookId}/points` | 点击地图候选标记查看地点卡，确认点位类型后加入当前路线 |
| 路线重算 | `POST /trip/screen/routebooks/{routebookId}/segments/recalculate` | 重算后重新读取路书详情和分段路线 |
| 推荐列表 | `GET /trip/screen/recommend/list` | 按路书和偏好编码分页读取，支持换一批 |
| 推荐搜索 | `POST /trip/screen/recommend/search` | 顶部搜索词按当前推荐分类发起智能搜索 |
| 推荐加入路线 | `POST /trip/screen/recommend/{id}/add-to-routebook` | 加入成功后重新读取点位和路线 |
| 创建分享码 | `POST /trip/share/create` | 创建 `VIEW_ONLY` 分享码并复制 |

推荐分类与 `prefCode` 的当前映射如下：

| 页面分类 | `prefCode` |
| --- | --- |
| 景点 | `SCENIC` |
| 美食 | `FOOD` |
| 住宿 | `HOTEL` |
| 补给 | `SUPPLY` |
| 拍照 | `PHOTO` |

如后端实际偏好编码不是上述值，需要提供稳定的偏好编码清单，或在接口中返回大屏分类与偏好编码的映射。

## 2. 现有接口需要补充

### 2.1 推荐列表缺少卡片展示和加入点位所需字段

当前 `TripRecommend` 只有标题、来源、摘要和各类评分，不能真实展示静态设计中的图片、距路线距离、用户评分和评价数；部分推荐也可能没有可加入路线的 POI 坐标。

建议在 `GET /trip/screen/recommend/list` 的每条 `rows` 中补充：

```json
{
  "id": 1001,
  "routebookId": 12,
  "prefCode": "SCENIC",
  "title": "四姑娘山双桥沟",
  "imageUrl": "/profile/upload/scenic.jpg",
  "distanceToRouteM": 12800,
  "rating": 4.8,
  "reviewCount": 328,
  "amapPoiId": "B0FF...",
  "lng": 102.8504,
  "lat": 31.1044,
  "address": "四川省阿坝藏族羌族自治州小金县",
  "pointType": "SCENIC",
  "recommendReason": "沿途景观丰富"
}
```

字段要求：

1. `distanceToRouteM` 的口径应为 POI 到当前路线折线的最短距离，单位米；无法计算时返回 `null`。
2. `rating` 和 `reviewCount` 必须有明确数据来源，无真实数据时返回 `null`，不要用 AI 评分代替用户评分。
3. `imageUrl` 应返回前端可访问的地址；没有图片时返回 `null`。
4. 能执行“加入路线”的推荐必须返回 `amapPoiId`、`lng`、`lat`、`address` 和 `pointType`，或保证 `add-to-routebook` 能仅根据推荐 ID 完成点位落库。

在这些字段补齐前，前端只展示现有的推荐分、来源域名和推荐理由，不展示伪造的距离、评分、评价数和图片。

### 2.2 分享接口建议返回可直接访问的地址

当前创建分享接口只明确了 `shareCode`。大屏暂时复制分享码，无法向用户提供可点击的完整分享地址。

建议 `POST /trip/share/create` 在 `data` 中增加：

```json
{
  "shareCode": "R8K2P6",
  "shareUrl": "https://example.com/share/R8K2P6"
}
```

`shareUrl` 应包含部署环境的公开前端地址；若由前端拼接，需要后端或部署配置明确公开分享路由格式。

### 2.3 POI 搜索响应结构需要固定

现有接口文档将响应定义成宽泛的 `Record<string, unknown>`。前端目前兼容 `data` 为数组，以及 `data.pois`、`data.list`、`data.rows` 三种结构。

建议固定为：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": [
    {
      "id": "B0FF...",
      "name": "四姑娘山双桥沟",
      "address": "四川省阿坝藏族羌族自治州小金县",
      "type": "风景名胜",
      "location": "102.8504,31.1044"
    }
  ]
}
```

其中 `id`、`name`、`location` 是添加路线点位的必要字段。

### 2.4 创建和复制接口必须返回新路书 ID

大屏创建或复制路书后需要立即切换到新路书并继续地图编辑。如果接口只返回“操作成功”，前端只能再次查询最近更新的路书进行猜测；并发创建、更新时间精度不足或排序规则变化时，可能切换到错误记录。

以下接口需要在 `AjaxResult.data` 中明确返回新路书：

- `POST /trip/screen/routebooks`
- `POST /trip/screen/routebooks/{id}/copy`

推荐响应：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 128,
    "title": "川西小环线 5 日摩旅",
    "status": "DRAFT",
    "visibility": "PRIVATE"
  }
}
```

最低要求是 `data` 直接返回新路书 ID：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": 128
}
```

不要把 ID 放入 `msg`。前端当前兼容“数字 ID”和“包含 id 的路书对象”；接口未返回 ID 时仅以最近更新记录临时降级，不能作为最终联调口径。

## 3. 需要新增的接口

### 3.1 路书行程指标接口

静态设计包含累计爬升、预计油耗、最佳季节和平均气温，现有路书、点位及分段接口均不能准确提供。建议新增：

- 方法：`GET`
- 路径：`/trip/screen/routebooks/{routebookId}/metrics`
- 权限码：`trip:routebook:query`
- 参数：`routebookId`，路书 ID

建议响应：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "elevationGainM": 12850,
    "estimatedFuelL": 68.4,
    "fuelConsumptionLPer100Km": 7.95,
    "bestSeasonText": "5月—10月",
    "temperatureMinC": 8,
    "temperatureMaxC": 20,
    "weatherUpdatedAt": "2026-07-24 10:00:00"
  }
}
```

统计口径：

1. `elevationGainM` 为按路线方向累计的正向海拔增量，单位米。
2. `estimatedFuelL` 必须基于当前用户选择的车型或明确的百公里油耗计算；没有车型参数时返回 `null`。
3. `bestSeasonText` 是路线长期出行建议，不应由单日天气直接推导。
4. 气温字段应说明是实时、未来预报还是历史气候区间；接口失败时对应字段返回 `null`。
5. 暂无真实数据的字段返回 `null`，不要返回 `0`。前端对 `null` 展示 `--`。

### 3.2 路书收藏接口

当前没有查询收藏状态、收藏和取消收藏接口。建议新增：

#### 查询收藏状态

- `GET /trip/screen/routebooks/{routebookId}/favorite`

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "favorited": true,
    "favoriteTime": "2026-07-24 10:00:00"
  }
}
```

#### 收藏

- `POST /trip/screen/routebooks/{routebookId}/favorite`

#### 取消收藏

- `DELETE /trip/screen/routebooks/{routebookId}/favorite`

要求按当前登录用户和路书 ID 保证唯一；重复收藏应幂等成功。前端在接口补齐前不保留仅存在浏览器内的假收藏状态。

## 4. 待确认的产品能力

地图工具栏中的“业务图层”和“大屏设置”目前只有静态入口，但没有明确的业务定义，暂不建议直接设计接口。需要先确认：

1. 业务图层需要控制哪些数据：加油站、维修点、天气、路况、风险区域，还是路书自定义图层。
2. 大屏设置是当前用户偏好、当前路书配置，还是设备级展示配置。
3. 配置是否需要跨设备同步，以及保存范围和权限边界。

确认后再分别定义图层数据接口和用户配置接口，避免产生无法落地的通用 JSON 接口。

## 5. 联调验收建议

1. 分别验证带 `routebookId` 和不带 `routebookId` 的大屏入口。
2. 验证路书无点位、点位缺坐标、分段接口失败、单段缺 `polyline` 四种降级场景。
3. 验证推荐分类无数据、多于一页、搜索失败及推荐缺 POI 信息的提示。
4. 验证新增点位和路线重算后，详情中的总里程、总耗时是否同步更新。
5. 验证发布、分享、修改路书的权限失败提示，以及不同数据权限账号只能看到其可访问路书。
