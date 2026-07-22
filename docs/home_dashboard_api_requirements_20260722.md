# 智能路书首页统计接口需求

生成日期：2026-07-22

## 1. 背景

首页按照 `docs/后台管理设计风格.png` 实现数据概览、近 7 日趋势、近期路书、点位类型分布、出行状态分布和系统通知。前端不得使用模拟业务数据，因此对现有接口能准确提供的数据直接接入，对不能准确推导的数据提出本接口需求。

## 2. 已接入接口

| 首页模块 | 当前接口 | 使用方式 | 备注 |
| --- | --- | --- | --- |
| 路书总数、近期路书 | `GET /trip/screen/routebooks/page` | `pageNum=1&pageSize=5&orderByColumn=updateTime&isAsc=desc` | 使用 `total` 和前 5 条 `rows` |
| 推荐结果总数 | `GET /trip/screen/recommend/list` | `pageNum=1&pageSize=1` | 仅使用 `total` |
| 系统通知 | `GET /system/notice/listTop` | 无参数 | 展示前 4 条与未读数 |

现有点位接口必须指定 `routebookId`，现有出行接口仅支持按 `journeyId` 查询详情，均无法提供首页全局统计。现有路书和推荐分页接口也不能准确提供同比、趋势和热度数据。

## 3. 建议新增接口

### 3.1 接口定义

- 方法：`GET`
- 路径：`/trip/screen/dashboard/overview`
- 权限码：`trip:dashboard:view`
- 参数：`days`，可选，整数，默认 `7`，建议范围 `7-30`
- 返回结构：沿用若依 `AjaxResult`

### 3.2 建议返回数据

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "summary": {
      "routebookTotal": 128,
      "routebookChange": 12,
      "pointTotal": 864,
      "pointChange": 28,
      "recommendationTotal": 342,
      "recommendationChange": 18,
      "activeJourneyTotal": 19,
      "activeJourneyChange": -4
    },
    "trend": [
      {
        "date": "2026-07-16",
        "newRoutebookCount": 15,
        "publishedRoutebookCount": 7,
        "startedJourneyCount": 2
      }
    ],
    "popularRoutebooks": [
      {
        "routebookId": 1,
        "title": "川西小环线 5 日摩旅",
        "coverUrl": "/profile/upload/example.jpg",
        "totalDistanceM": 860000,
        "pointCount": 18,
        "heatValue": 326
      }
    ],
    "pointTypeDistribution": [
      { "typeCode": "SCENIC", "typeName": "景点", "count": 382 }
    ],
    "journeyStatusDistribution": [
      { "status": "NOT_STARTED", "statusName": "未开始", "count": 65 }
    ]
  }
}
```

## 4. 统计口径

1. `routebookTotal`：未删除路书总数，是否仅统计当前用户可见数据需要后端按权限统一处理。
2. `pointTotal`：未删除路书点位总数，统计范围必须与路书总数一致。
3. `recommendationTotal`：推荐结果总数，统计范围必须遵守当前用户数据权限。
4. `activeJourneyTotal`：状态为进行中的出行实例数量。
5. `*Change`：与前一个同长度周期相比的数量变化；无前期数据时返回 `null`，不要返回伪造的 `0`。
6. `trend`：按自然日聚合；无数据日期也需要补零，保证图表横轴连续。
7. `popularRoutebooks`：建议按最近 30 天访问、分享、出行和点位活跃度计算；在热度规则确认前可暂不返回该字段。
8. 分布数据只返回真实存在的分类或状态，前端负责计算百分比。

## 5. 异常与兼容要求

1. 单个统计项失败时，建议返回其他可用数据，并在 `warnings` 字段给出中文原因，避免整页不可用。
2. 所有数量字段使用整数；无权限的模块建议省略对应字段，不要用 `0` 混淆“无数据”和“无权限”。
3. 接口应遵守现有 Token、数据权限和若依响应结构。
4. 首页前端已提供加载、无数据、无权限和失败状态；接口完成后替换对应占位状态即可。
