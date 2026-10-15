<template>
  <main class="roadbook-screen">
    <header class="screen-header">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 48 48"><path d="M5 39 17 14l7 13 7-21 12 33H5Z"/><path d="m14 31 5-6 5 5 5-8 7 9"/></svg>
        </span>
        <div><strong>ROADBOOK</strong><small>摩旅智能路书</small></div>
      </div>

      <label v-if="!poiSearchMode" class="global-search">
        <el-icon><Search /></el-icon>
        <input v-model="keyword" placeholder="搜索景点、美食和路线推荐" @keyup.enter="handleSearch" />
        <kbd>⌘ K</kbd>
      </label>
      <div v-else class="global-search global-search--mode">
        <el-icon><Location /></el-icon>
        <span>正在地图中添加路线地点</span>
        <kbd>ESC</kbd>
      </div>

      <nav class="header-actions" aria-label="路书操作">
        <button type="button" @click="openRoutebookDrawer"><el-icon><Collection /></el-icon><span>我的路书</span></button>
        <button type="button" @click="showUnavailable('收藏')"><el-icon><Star /></el-icon><span>收藏</span></button>
        <button type="button" :disabled="!routebookId" @click="shareCurrentRoutebook"><el-icon><Share /></el-icon><span>分享</span></button>
        <button type="button" class="outlined" :disabled="!routebookId || saving" @click="saveRoutebook">
          <el-icon><FolderChecked /></el-icon><span>{{ saving ? '保存中' : '保存' }}</span>
        </button>
        <button type="button" class="publish" :disabled="!routebookId || publishing || routebook?.status === 'PUBLISHED'" @click="publishCurrentRoutebook">
          <el-icon><Promotion /></el-icon><span>{{ routebook?.status === 'PUBLISHED' ? '已发布' : '发布路书' }}</span>
        </button>
        <img class="avatar" :src="userStore.avatar || defaultAvatar" alt="用户头像" />
        <button type="button" class="admin-entry" @click="enterAdmin">
          <el-icon><Setting /></el-icon><span>进入后台</span>
        </button>
      </nav>
    </header>

    <section class="screen-workspace">
      <aside class="route-panel glass-panel">
        <div class="route-heading">
          <div class="route-heading-main">
            <div class="route-title-row">
              <h1>{{ routebook?.title || '暂无路书' }}</h1>
              <button type="button" class="departure-chip" :disabled="!routebookId" aria-label="设置出发时间" @click="openDepartureDialog">
                <el-icon><Stopwatch /></el-icon>
                <span>{{ departureText }}</span>
              </button>
            </div>
            <el-dropdown :disabled="!routebookId" trigger="click" @command="(command: string) => routebook && handleRoutebookCommand(command, routebook)">
              <button type="button" aria-label="更多路书操作"><el-icon><MoreFilled /></el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑路书</el-dropdown-item>
                  <el-dropdown-item command="copy">复制路书</el-dropdown-item>
                  <el-dropdown-item v-if="routebook?.status !== 'PUBLISHED'" command="publish">发布路书</el-dropdown-item>
                  <el-dropdown-item command="archive">归档路书</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除路书</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="route-meta">
            <p><span class="route-status">{{ statusLabel }}</span>{{ updateDateText }}</p>
            <button type="button" aria-label="展开面板" @click="showUnavailable('左侧面板展开')"><el-icon><FullScreen /></el-icon></button>
          </div>
        </div>

        <div class="route-summary">
          <div><strong>{{ dayCount ? `${dayCount}天` : '--' }}</strong><span>行程天数</span></div>
          <div><strong>{{ routePoints.length }}个</strong><span>途经地点</span></div>
          <div><strong>{{ distanceText }}</strong><span>总里程</span></div>
        </div>

        <div class="route-tabs">
          <button type="button" :class="{ active: leftTab === 'nodes' }" @click="leftTab = 'nodes'">路线节点</button>
          <button type="button" :class="{ active: leftTab === 'overview' }" @click="leftTab = 'overview'">行程概览</button>
        </div>

        <div v-if="leftTab === 'nodes'" class="route-list-wrap">
          <div v-if="dataLoading" class="route-list-skeleton" aria-label="正在加载路线点">
            <article v-for="index in 2" :key="index">
              <span></span><i></i><i></i><small></small>
            </article>
          </div>
          <div v-else-if="dataError" class="route-list-state route-list-state--error">
            <el-icon><WarningFilled /></el-icon>
            <strong>路线点加载失败</strong>
            <p>{{ dataError }}</p>
            <button type="button" @click="loadScreenData">重新加载</button>
          </div>
          <div v-else-if="routePoints.length === 0" class="route-list-state">
            <el-icon><Location /></el-icon>
            <strong>当前没有路线点</strong>
            <p>请先添加起点，再继续规划途经点和终点。</p>
            <button type="button" :disabled="!routebookId" @click="enterPoiSearchMode">添加第一个地点</button>
          </div>
          <template v-else>
            <!-- 时间轴序号与卡片分栏，避免多点位时节点、标题和地址相互挤压。 -->
            <ol class="route-list">
            <li
              v-for="(point, index) in routePoints"
              :key="point.id || index"
              :class="{
                selected: selectedPoint === index,
                dragging: draggingPointIndex === index,
                'drop-target': dragOverPointIndex === index && draggingPointIndex !== index
              }"
              @dragover.prevent="handlePointDragOver(index)"
              @drop.prevent="handlePointDrop(index)"
              @click="focusRoutePoint(index)"
            >
              <span class="timeline-order" :class="[`timeline-order--${point.tone}`, { active: selectedPoint === index }]">{{ index + 1 }}</span>
              <article class="node-card">
                <header>
                  <strong>{{ point.name }}</strong>
                  <div class="node-card-actions">
                    <el-tooltip content="拖拽调整顺序" placement="top">
                      <el-icon
                        class="node-drag-handle"
                        draggable="true"
                        @click.stop
                        @dragstart.stop="handlePointDragStart($event, index)"
                        @dragend.stop="handlePointDragEnd"
                      ><Rank /></el-icon>
                    </el-tooltip>
                    <el-tooltip :content="index === 0 ? '已是首个节点' : '向上移动'" placement="top">
                      <el-icon
                        class="node-move"
                        :class="{ 'is-disabled': index === 0 }"
                        @click.stop="moveRoutebookPoint(index, index - 1)"
                      ><ArrowUp /></el-icon>
                    </el-tooltip>
                    <el-tooltip :content="index === routePoints.length - 1 ? '已是末个节点' : '向下移动'" placement="top">
                      <el-icon
                        class="node-move"
                        :class="{ 'is-disabled': index === routePoints.length - 1 }"
                        @click.stop="moveRoutebookPoint(index, index + 1)"
                      ><ArrowDown /></el-icon>
                    </el-tooltip>
                    <el-tooltip content="删除点位" placement="top">
                      <el-icon class="node-delete" @click.stop="removeRoutebookPoint(point)"><Delete /></el-icon>
                    </el-tooltip>
                    <el-dropdown trigger="click" @click.stop @command="(command: string) => handlePointCommand(command, point, index)">
                      <el-icon class="point-more"><MoreFilled /></el-icon>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="edit">编辑点位</el-dropdown-item>
                          <el-dropdown-item command="up" :disabled="index === 0">向上移动</el-dropdown-item>
                          <el-dropdown-item command="down" :disabled="index === routePoints.length - 1">向下移动</el-dropdown-item>
                          <el-dropdown-item command="delete" divided>删除点位</el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </header>
                <p><el-icon><Location /></el-icon><span>{{ point.address || '暂无详细地址' }}</span></p>
                <footer>
                  <span class="node-type" :class="`node-type--${point.tone}`">{{ point.type }}</span>
                  <button type="button" @click.stop="focusRoutePoint(index)">查看地图</button>
                </footer>
              </article>
            </li>
            </ol>
            <button type="button" class="route-add-prompt" :disabled="!routebookId" @click="enterPoiSearchMode">
              <span><el-icon><Plus /></el-icon></span>
              <strong>继续添加途经点，完善你的路线</strong>
            </button>
          </template>
        </div>
        <div v-else class="overview-copy">
          <span>{{ dayCount ? `DAY 01—${String(dayCount).padStart(2, '0')}` : '行程天数待规划' }}</span>
          <h2>{{ overviewTitle }}</h2>
          <p>{{ routebook?.description || '当前路书暂无行程描述。' }}</p>
        </div>

        <div class="route-footer">
          <button type="button" class="primary-soft" :disabled="!routebookId" @click="enterPoiSearchMode"><el-icon><Plus /></el-icon>添加地点</button>
          <button type="button" :disabled="!routebookId || optimizing" @click="optimizeRoute"><el-icon><MagicStick /></el-icon>{{ optimizing ? '计算中' : '优化路线' }}</button>
        </div>
      </aside>

      <aside class="map-toolbar glass-panel" aria-label="地图工具">
        <div class="map-toolbar-tools">
          <button
            v-for="(tool, index) in mapTools"
            :key="tool.label"
            type="button"
            :class="{ active: activeTool === index }"
            @click="handleMapTool(index)"
          >
            <el-icon><component :is="tool.icon" /></el-icon>
            <span>{{ tool.label }}</span>
          </button>
        </div>
        <div class="map-toolbar-toggles">
          <button type="button" :class="{ active: mapLayer === 'sat' }" @click="toggleMapLayer">
            <el-icon><MapLocation /></el-icon>
            <span>卫星图</span>
          </button>
          <button type="button" :class="{ active: weatherVisible }" @click="toggleWeather">
            <el-icon><Sunny /></el-icon>
            <span>天气</span>
          </button>
          <button type="button" :class="{ active: mapPickEnabled }" @click="toggleMapPick">
            <el-icon><Location /></el-icon>
            <span>选点</span>
          </button>
          <button type="button" :class="{ active: mapStyleOpen }" @click.stop="toggleMapStyle">
            <el-icon><Brush /></el-icon>
            <span>风格</span>
          </button>
          <div v-if="mapStyleOpen" class="map-style-panel glass-panel" aria-label="地图风格">
            <div class="map-style-panel__head">
              <strong>地图风格</strong>
              <button type="button" aria-label="关闭地图风格面板" @click="mapStyleOpen = false">×</button>
            </div>
            <div class="map-style-panel__grid">
              <button
                v-for="option in MAP_STYLE_OPTIONS"
                :key="option.key"
                type="button"
                :class="{ selected: mapStyleKey === option.key }"
                @click.stop="applyMapStyle(option.key)"
              >
                <span class="map-style-swatch" :style="{ background: option.color }" />
                <span class="map-style-name">{{ option.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <section class="map-stage" aria-label="川西小环线路线地图">
        <div ref="mapContainerRef" class="amap-container" />
        <div v-if="dataLoading" class="map-feedback">
          <el-icon class="is-loading"><Loading /></el-icon>
          <strong>正在读取路书</strong>
          <span>正在加载路书详情、路线节点与推荐内容</span>
        </div>
        <div v-else-if="dataError" class="map-feedback map-feedback--error">
          <el-icon><WarningFilled /></el-icon>
          <strong>路书加载失败</strong>
          <span>{{ dataError }}</span>
          <button type="button" @click="loadScreenData">重新加载</button>
        </div>
        <div v-else-if="!routebookId" class="map-feedback">
          <el-icon><Guide /></el-icon>
          <strong>还没有可展示的路书</strong>
          <span>在大屏创建一条草稿路书，然后从地图搜索并添加第一个地点。</span>
          <button type="button" @click="openCreateRoutebook">新建路书</button>
        </div>
        <div v-else-if="mapLoading" class="map-feedback">
          <el-icon class="is-loading"><Loading /></el-icon>
          <strong>正在加载高德地图</strong>
          <span>正在准备地图底图与定位能力</span>
        </div>
        <div v-else-if="mapError" class="map-feedback map-feedback--error">
          <el-icon><WarningFilled /></el-icon>
          <strong>地图加载失败</strong>
          <span>{{ mapError }}</span>
          <button type="button" @click="initializeMap">重新加载</button>
        </div>
        <div v-if="!poiSearchMode && !mapLoading && !mapError && locationMessage" class="location-feedback" :class="`location-feedback--${locationStatus}`">
          <el-icon v-if="locationStatus === 'locating'" class="is-loading"><Loading /></el-icon>
          <el-icon v-else><Position /></el-icon>
          <span>{{ locationMessage }}</span>
          <button v-if="locationStatus === 'error'" type="button" @click="requestBrowserLocation">重新定位</button>
        </div>
        <section v-if="poiSearchMode" class="poi-search-panel glass-panel" :class="`poi-search-panel--${poiSearchStatus}`">
          <form class="poi-search-form" @submit.prevent="searchPoiOnMap">
            <el-icon v-if="poiSearchStatus === 'searching'" class="is-loading"><Loading /></el-icon>
            <el-icon v-else><Search /></el-icon>
            <input
              v-model="keyword"
              autofocus
              placeholder="搜索要加入路线的地点"
              aria-label="搜索路线地点"
              :disabled="poiSearchStatus === 'searching'"
            />
            <kbd>Enter</kbd>
            <button class="poi-search-exit" type="button" @click="exitPoiSearchMode">退出</button>
          </form>
          <div class="poi-search-message">
            <span>{{ poiSearchMessage }}</span>
          </div>
        </section>
        <article v-if="(poiSearchMode || mapPickPending) && selectedPoi" class="poi-result-card glass-panel">
          <header>
            <div><span>{{ mapPickPending ? '地图选点' : '已选择地点' }}</span><h3>{{ selectedPoi.name || '未命名地点' }}</h3></div>
            <button type="button" aria-label="关闭地点卡片" @click="dismissPendingPoi">×</button>
          </header>
          <p>{{ selectedPoi.address || selectedPoi.type || '暂无地址信息' }}</p>
          <!-- 周边地点：逆地理自带候选 + 关键词搜索兜底，点选直接切换为所选地点 -->
          <div v-if="mapPickPending" class="poi-pick-wrap">
            <div class="poi-pick-search">
              <el-input
                v-model="mapPickKeyword"
                size="small"
                clearable
                placeholder="搜附近地名（如：黄果树）"
                aria-label="搜索附近地点"
                @keyup.enter="searchNearbyPick"
                @clear="resetNearbyPick"
              />
              <button type="button" :disabled="mapPickSearching" @click="searchNearbyPick">
                {{ mapPickSearching ? '搜…' : '搜索' }}
              </button>
            </div>
            <div v-if="mapPickPois.length" class="poi-pick-list">
              <span class="poi-pick-title">周边地点</span>
              <button
                v-for="poi in mapPickPois"
                :key="poi.id"
                type="button"
                class="poi-pick-item"
                :class="{ active: selectedPoi && poi.id === selectedPoi.id }"
                @click="pickNearbyPoi(poi)"
              >
                <span class="poi-pick-name">{{ poi.name }}</span>
                <small>{{ poi.type || '地点' }}</small>
              </button>
            </div>
            <p v-else-if="mapPickNoResult" class="poi-pick-empty">附近没搜到地点，换个关键词试试</p>
          </div>
          <div class="poi-result-meta">
            <span>{{ selectedPoi.type || '地点类型未知' }}</span>
            <span v-if="selectedPoi.distance">{{ selectedPoi.distance }}m</span>
          </div>
          <footer>
            <el-select v-model="pointType" size="small" aria-label="点位类型">
              <el-option v-for="item in pointTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <label class="poi-add-day" aria-label="所属天数">
              <span>第</span>
              <el-input-number v-model="pendingAddDayNo" :min="1" :max="99" size="small" controls-position="right" />
              <span>天</span>
            </label>
            <button type="button" :disabled="addingPointId !== undefined" @click="addSelectedPoi">
              {{ addingPointId !== undefined ? '添加中…' : '加入路线' }}
            </button>
          </footer>
        </article>

        <div class="map-controls glass-panel">
          <button type="button" aria-label="放大地图" @click="changeMapZoom(1)"><el-icon><Plus /></el-icon></button>
          <span>{{ zoom }}</span>
          <button type="button" aria-label="缩小地图" @click="changeMapZoom(-1)"><el-icon><Minus /></el-icon></button>
        </div>
        <div v-if="weatherVisible && weatherInfo" class="map-weather glass-panel" aria-label="当前天气">
          <span class="map-weather-icon" aria-hidden="true">{{ weatherInfo.icon }}</span>
          <div class="map-weather-meta">
            <strong>{{ weatherInfo.city }} {{ weatherInfo.temperature }}°C</strong>
            <small>{{ weatherInfo.weather }} · {{ weatherInfo.windDirection }}风 {{ weatherInfo.windPower }} 级</small>
          </div>
        </div>
        <!-- 地图点位详情：点击路线点 marker 弹出，支持上移/下移/删除 -->
        <div v-if="detailPointIndex >= 0 && points[detailPointIndex]" class="map-point-detail glass-panel" aria-label="点位详情">
          <header>
            <div>
              <span>点位详情</span>
              <h3>{{ points[detailPointIndex].pointName || '未命名地点' }}</h3>
            </div>
            <button type="button" aria-label="关闭点位详情" @click="closePointDetail">×</button>
          </header>
          <p>{{ points[detailPointIndex].address || '暂无详细地址' }}</p>
          <div class="map-point-detail-tags">
            <span>{{ points[detailPointIndex].pointType || '点位' }}</span>
            <span v-if="points[detailPointIndex].source === 'AMAP'">高德</span>
          </div>
          <footer>
            <button type="button" @click="editDetailPoint">编辑</button>
            <button type="button" :disabled="detailPointIndex === 0" @click="moveDetailPoint(-1)">上移</button>
            <button type="button" :disabled="detailPointIndex === points.length - 1" @click="moveDetailPoint(1)">下移</button>
            <button type="button" class="danger" @click="removeDetailPoint">删除</button>
          </footer>
        </div>
        <button class="locate-button glass-panel" :class="{ locating: locationStatus === 'locating' }" type="button" aria-label="定位当前位置" @click="requestBrowserLocation">
          <el-icon><Position /></el-icon>
        </button>
      </section>

      <aside class="recommend-panel glass-panel">
        <div class="recommend-heading">
          <h2><el-icon><MagicStick /></el-icon><span>AI 智能推荐</span></h2>
          <button type="button" :disabled="recommendLoading" aria-label="AI 搜索并刷新推荐" @click="searchAndRefreshRecommendations"><el-icon><Refresh /></el-icon></button>
        </div>
        <div class="recommend-tabs" role="tablist">
          <button
            v-for="(tab, index) in recommendTabs"
            :key="tab.label"
            type="button"
            :class="{ active: recommendTab === index }"
            @click="changeRecommendTab(index)"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <div v-if="recommendLoading" class="recommend-empty">正在加载推荐内容…</div>
        <div v-else-if="recommendations.length === 0" class="recommend-empty">当前分类暂无推荐内容，点击右上角刷新按钮可发起 AI 搜索</div>
        <div v-else class="recommend-list">
          <article v-for="(item, index) in recommendations" :key="item.id || index">
            <div class="recommend-image" :style="{ backgroundPosition: `${(index % 3) * 50}% center` }"><span>{{ item.prefCode || '推荐' }}</span></div>
            <div class="recommend-copy">
              <h3>{{ item.title || '未命名推荐' }}</h3>
              <p>{{ item.sourceDomain || '来源未知' }}</p>
              <div class="rating"><strong>{{ formatRecommendScore(item.finalScore) }}</strong></div>
              <small>{{ item.recommendReason || item.aiSummary || '暂无推荐理由' }}</small>
            </div>
            <button type="button" :disabled="!item.id || addingRecommendationId === item.id" @click="addRecommendation(item)">加入路线</button>
          </article>
        </div>
        <button class="change-batch" type="button" :disabled="recommendLoading || recommendationTotal <= recommendations.length" @click="changeRecommendationPage"><el-icon><Refresh /></el-icon>换一批</button>
      </aside>
    </section>

    <el-drawer v-model="routebookDrawerOpen" title="我的路书" size="520px" append-to-body @open="loadRoutebookList">
      <template #header>
        <div class="routebook-drawer-header">
          <div><strong>我的路书</strong><span>在大屏中创建、切换和维护路书</span></div>
          <el-button type="primary" icon="Plus" @click="openCreateRoutebook">新建路书</el-button>
        </div>
      </template>
      <div v-if="routebookListLoading" class="routebook-list-state">正在读取我的路书…</div>
      <div v-else-if="routebookList.length === 0" class="routebook-list-state">
        <span>当前还没有路书</span>
        <el-button type="primary" @click="openCreateRoutebook">创建第一条路书</el-button>
      </div>
      <div v-else class="routebook-card-list">
        <article v-for="item in routebookList" :key="item.id" :class="{ active: Number(item.id) === routebookId }">
          <button class="routebook-card-main" type="button" @click="selectRoutebook(Number(item.id))">
            <strong>{{ item.title || '未命名路书' }}</strong>
            <span>{{ routebookStatusLabel(item.status) }} · {{ item.totalDistanceM ? formatDistance(Number(item.totalDistanceM)) : '里程待规划' }} · {{ item.updateTime || '暂无更新时间' }}</span>
            <small>{{ item.startName || '起点待规划' }} → {{ item.endName || '终点待规划' }}</small>
          </button>
          <el-dropdown trigger="click" @command="(command: string) => handleRoutebookCommand(command, item)">
            <el-button circle text><el-icon><MoreFilled /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="edit">编辑基础信息</el-dropdown-item>
                <el-dropdown-item command="copy">复制路书</el-dropdown-item>
                <el-dropdown-item v-if="item.status !== 'PUBLISHED'" command="publish">发布路书</el-dropdown-item>
                <el-dropdown-item v-if="item.status !== 'ARCHIVED'" command="archive">归档路书</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除路书</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </article>
      </div>
      <el-pagination
        v-if="routebookListTotal > routebookListQuery.pageSize"
        v-model:current-page="routebookListQuery.pageNum"
        :page-size="routebookListQuery.pageSize"
        :total="routebookListTotal"
        layout="prev, pager, next"
        background
        @current-change="loadRoutebookList"
      />
    </el-drawer>

    <el-dialog v-model="routebookDialogOpen" :title="routebookForm.id ? '编辑路书' : '新建路书'" width="620px" append-to-body :close-on-click-modal="false">
      <el-form ref="routebookFormRef" :model="routebookForm" :rules="routebookRules" label-width="92px">
        <el-form-item label="路书标题" prop="title"><el-input v-model="routebookForm.title" maxlength="128" show-word-limit placeholder="例如：川西小环线 5 日摩旅" /></el-form-item>
        <el-form-item label="路书描述"><el-input v-model="routebookForm.description" type="textarea" :rows="4" maxlength="1000" show-word-limit placeholder="可填写路线主题、行程计划和注意事项" /></el-form-item>
        <div class="routebook-form-grid">
          <el-form-item label="可见性"><el-select v-model="routebookForm.visibility">
            <el-option v-for="item in trip_routebook_visibility" :key="item.value" :label="item.label" :value="item.value" />
          </el-select></el-form-item>
          <el-form-item label="路线模式"><el-select v-model="routebookForm.routeMode">
            <el-option v-for="item in trip_route_mode" :key="item.value" :label="item.label" :value="item.value" />
          </el-select></el-form-item>
        </div>
      </el-form>
      <template #footer>
        <el-button :disabled="routebookSubmitting" @click="routebookDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="routebookSubmitting" @click="submitRoutebook">{{ routebookForm.id ? '保存修改' : '创建并开始规划' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="pointEditDialogOpen" title="编辑路线点位" width="560px" append-to-body :close-on-click-modal="false">
      <el-form :model="pointEditForm" label-width="94px">
        <el-form-item label="点位名称"><el-input v-model="pointEditForm.pointName" maxlength="128" /></el-form-item>
        <div class="routebook-form-grid">
          <el-form-item label="点位类型"><el-select v-model="pointEditForm.pointType">
            <el-option v-for="item in pointTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select></el-form-item>
          <el-form-item label="所属天数"><el-input-number v-model="pointEditForm.dayNo" :min="1" :max="99" /></el-form-item>
        </div>
        <div class="routebook-form-grid">
          <el-form-item label="停留分钟"><el-input-number v-model="pointEditForm.stayMinutes" :min="0" :max="1440" /></el-form-item>
          <el-form-item label="打卡半径"><el-input-number v-model="pointEditForm.checkinRadiusM" :min="10" :max="10000" /></el-form-item>
        </div>
        <el-form-item label="备注"><el-input v-model="pointEditForm.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="pointEditSubmitting" @click="pointEditDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="pointEditSubmitting" @click="submitPointEdit">保存点位</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="departureDialogOpen" title="设置出发时间" width="420px" append-to-body :close-on-click-modal="false">
      <el-form label-width="94px">
        <el-form-item label="出发时间">
          <el-date-picker
            v-model="departureFormValue"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择出发日期与时间"
            style="width: 100%"
          />
        </el-form-item>
        <p class="departure-tip">未设置时大屏显示「待规划」；点右上角的小时钟随时可修改。</p>
      </el-form>
      <template #footer>
        <el-button @click="departureDialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="departureSaving" @click="saveDeparture">保存</el-button>
      </template>
    </el-dialog>

  </main>
</template>

<script setup lang="ts" name="RoadbookScreen">
import { ElMessage, ElMessageBox } from 'element-plus'
import { addRecommendationToRoutebook, listRecommendations, searchRecommendations } from '@/api/trip/recommend'
import { searchPoi } from '@/api/trip/map'
import { addRoutebookPoint, deleteRoutebookPoint, listRoutebookPoints, sortRoutebookPoints, updateRoutebookPoint } from '@/api/trip/point'
import {
  addRoutebook, archiveRoutebook, copyRoutebook, deleteRoutebook, getRoutebook,
  listRoutebooks, publishRoutebook, recordRoutebookView, updateRoutebook
} from '@/api/trip/routebook'
import { createShareLink } from '@/api/trip/share'
import { listRoutebookSegments, recalculateRoutebookSegments } from '@/api/trip/segment'
import defaultAvatar from '@/assets/images/profile.jpg'
import useUserStore from '@/store/modules/user'
import { loadAmap } from '@/utils/amapLoader'
import type { TripRecommend } from '@/types/api/trip/recommend'
import type { PoiItem } from '@/types/api/trip/map'
import type { TripRoutebookPoint, TripRoutebookSegment } from '@/types/api/trip/point'
import type { TripRoutebook, TripRoutebookQuery } from '@/types/api/trip/routebook'
import {
  ArrowDown, ArrowUp, Brush, Camera, Collection, Delete, EditPen, Food, FolderChecked, FullScreen, Guide,
  House, Loading, Location, MagicStick, MapLocation, Minus, MoreFilled, OfficeBuilding, Picture,
  Plus, Position, Promotion, Rank, Refresh, Search, Setting, Share, Star, Stopwatch, Sunny,
  WarningFilled
} from '@element-plus/icons-vue'

interface ScreenRoutePoint extends TripRoutebookPoint {
  name: string
  type: string
  distance: string
  tone: string
  icon: any
}

const keyword = ref('')
const leftTab = ref<'nodes' | 'overview'>('nodes')
const selectedPoint = ref(0)
const activeTool = ref(0)
const recommendTab = ref(0)
const recommendationPage = ref(1)
const recommendationTotal = ref(0)
const zoom = ref(5)
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { trip_routebook_visibility, trip_route_mode } = useDict('trip_routebook_visibility', 'trip_route_mode')
const mapContainerRef = ref<HTMLElement>()
const mapLoading = ref(true)
const mapError = ref('')
const dataLoading = ref(false)
const dataError = ref('')
const recommendLoading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const optimizing = ref(false)
const addingRecommendationId = ref<number>()
const routebookDrawerOpen = ref(false)
const routebookListLoading = ref(false)
const routebookList = ref<TripRoutebook[]>([])
const routebookListTotal = ref(0)
const routebookListQuery = reactive<Required<Pick<TripRoutebookQuery, 'pageNum' | 'pageSize'>>>({ pageNum: 1, pageSize: 8 })
const routebookDialogOpen = ref(false)
const routebookSubmitting = ref(false)
const routebookForm = ref<TripRoutebook>({})
const routebookFormRef = ref<any>()
const pointEditDialogOpen = ref(false)
const pointEditSubmitting = ref(false)
const pointEditForm = ref<TripRoutebookPoint>({})
const draggingPointIndex = ref<number>()
const dragOverPointIndex = ref<number>()
const poiSearchMode = ref(false)
const poiSearchStatus = ref<'idle' | 'searching' | 'results' | 'empty' | 'error'>('idle')
const poiSearchMessage = ref('输入地点关键词并按回车，搜索结果会显示在地图上')
const pointType = ref('WAYPOINT')
/** 高德内置地图主题预置选集：mapStyle 用 amap://styles/<key> 切换，本地记忆偏好 */
const ROADBOOK_MAP_STYLE_KEY = 'roadbook.mapStyle'
const MAP_STYLE_OPTIONS: { key: string; name: string; color: string }[] = [
  { key: 'normal', name: '标准', color: 'linear-gradient(135deg,#e9edf3,#c8d2e0)' },
  { key: 'light', name: '浅色', color: 'linear-gradient(135deg,#f7fafc,#dde7f0)' },
  { key: 'whitesmoke', name: '白雾', color: 'linear-gradient(135deg,#f2f7f7,#cfe0e0)' },
  { key: 'fresh', name: '清新', color: 'linear-gradient(135deg,#eaf6ee,#bfe0c8)' },
  { key: 'macaron', name: '马卡龙', color: 'linear-gradient(135deg,#fdf0ec,#f4d6c6)' },
  { key: 'graffiti', name: '涂鸦', color: 'linear-gradient(135deg,#f6f2ff,#d9c9f2)' },
  { key: 'grey', name: '灰色', color: 'linear-gradient(135deg,#eceff2,#c2cad2)' },
  { key: 'blue', name: '蓝色', color: 'linear-gradient(135deg,#ddeaef,#9fc4db)' },
  { key: 'dark', name: '深色', color: 'linear-gradient(135deg,#2b3340,#141a22)' },
  { key: 'darkblue', name: '暗蓝', color: 'linear-gradient(135deg,#1e2a3a,#0d1520)' },
  { key: 'midnight', name: '午夜', color: 'linear-gradient(135deg,#14151c,#050507)' },
  { key: 'satellite', name: '卫星·写实', color: 'linear-gradient(135deg,#86a76b,#556a4a)' }
]

/** 读取本地记忆的地图风格，未设置过时默认使用高德标准底色（与原版一致） */
function readMapStyle(): string {
  try {
    const saved = localStorage.getItem(ROADBOOK_MAP_STYLE_KEY)
    if (saved && saved !== 'satellite' && MAP_STYLE_OPTIONS.some((option) => option.key === saved)) return saved
  } catch (error) {
    console.warn('大屏读取地图风格偏好失败，使用默认风格。', error)
  }
  return 'normal'
}

const mapStyleKey = ref<string>(readMapStyle())
const mapStyleOpen = ref(false)
const pointCandidates = ref<PoiItem[]>([])
const selectedPoi = ref<PoiItem>()
/** 添加点位时的所属天数（搜索/地图选点共用，默认落在当前最大天数或第 1 天） */
const pendingAddDayNo = ref(1)
/** 出发时间弹窗状态：departureFormValue 保存「YYYY-MM-DD HH:mm:ss」文本 */
const departureDialogOpen = ref(false)
const departureFormValue = ref('')
const departureSaving = ref(false)
const addingPointId = ref<string>()
const routebookId = ref<number>()
const routebook = ref<TripRoutebook>()
const points = ref<TripRoutebookPoint[]>([])
const segments = ref<TripRoutebookSegment[]>([])
const recommendations = ref<TripRecommend[]>([])
const locationStatus = ref<'idle' | 'locating' | 'ready' | 'error'>('idle')
const locationMessage = ref('')
let amap: any
let mapInstance: any
let locationOverlays: any[] = []
let routeOverlays: any[] = []
let pointMarkers: any[] = []
let poiSearchOverlays: any[] = []
let selectedPoiMarkerElement: HTMLElement | undefined
let mapPickPlaceSearch: any
/** 当前选点坐标，作为卡片内「周边搜索」的中心 */
let mapPickSearchCenter: number[] = []
const mapLayer = ref<'std' | 'sat'>('std')
const weatherVisible = ref(false)
const weatherInfo = ref<{ city: string; weather: string; temperature: string; windDirection: string; windPower: string; icon: string }>()
const mapPickEnabled = ref(false)
const mapPickPending = ref(false)
/** 地图选点的周边地点候选（逆地理解析结果自带周边 POI），供用户从中选取有名字的地点 */
const mapPickPois = ref<PoiItem[]>([])
/** 选点卡片内的周边关键词搜索状态 */
const mapPickKeyword = ref('')
const mapPickSearching = ref(false)
const mapPickNoResult = ref(false)
/** 地图点位详情浮层当前展示的路线点下标，-1 表示关闭 */
const detailPointIndex = ref(-1)
let satLayer: any
let roadLayer: any
let mapWeatherPlugin: any
let mapGeocoder: any
let weatherRefreshTimer: number | undefined

const mapTools = [
  { label: '编辑', icon: EditPen },
  { label: '地点搜索', icon: Search },
  { label: '路线规划', icon: Guide }
]

const recommendTabs = [
  { label: '景点', code: 'SCENIC', icon: Picture },
  { label: '美食', code: 'FOOD', icon: Food },
  { label: '住宿', code: 'HOTEL', icon: House },
  { label: '补给', code: 'SUPPLY', icon: OfficeBuilding },
  { label: '拍照', code: 'PHOTO', icon: Camera }
]

const pointTypeOptions = [
  { label: '起点', value: 'START' },
  { label: '终点', value: 'END' },
  { label: '途经点', value: 'WAYPOINT' },
  { label: '景点', value: 'SCENIC' },
  { label: '美食', value: 'FOOD' },
  { label: '住宿', value: 'HOTEL' },
  { label: '休息点', value: 'REST' },
  { label: '加油站', value: 'FUEL' },
  { label: '充电站', value: 'CHARGE' },
  { label: '维修点', value: 'REPAIR' },
  { label: '拍照点', value: 'PHOTO' },
  { label: '自定义', value: 'CUSTOM' }
]

const routebookRules: Record<string, any[]> = {
  title: [{ required: true, message: '请输入路书标题', trigger: 'blur' }]
}

const statusLabel = computed(() => {
  return routebookStatusLabel(routebook.value?.status)
})
const updateDateText = computed(() => routebook.value?.updateTime ? `更新于 ${String(routebook.value.updateTime).slice(0, 10)}` : '尚无更新时间')

const totalDistance = computed(() => {
  if (routebook.value?.totalDistanceM !== undefined && routebook.value.totalDistanceM !== null) {
    return Number(routebook.value.totalDistanceM)
  }
  return segments.value.reduce((total: number, segment: TripRoutebookSegment) => total + Number(segment.distanceM || 0), 0)
})

const distanceText = computed(() => totalDistance.value > 0 ? formatDistance(totalDistance.value) : '--')
/** 出发时间展示文本：有值显示「MM-DD HH:mm」短格式，未设置显示「待规划」 */
const departureText = computed(() => {
  const raw = routebook.value?.startDate
  if (!raw) return '待规划'
  const text = String(raw)
  return text.length >= 16 ? text.slice(5, 16) : text
})
const dayCount = computed(() => Math.max(points.value.length > 0 ? 1 : 0, ...points.value.map((point: TripRoutebookPoint) => Number(point.dayNo || 0))))
const overviewTitle = computed(() => {
  const start = routebook.value?.startName || points.value[0]?.pointName
  const end = routebook.value?.endName || points.value[points.value.length - 1]?.pointName
  return start && end ? `从${start}出发，前往${end}` : '路线起止点待完善'
})

const routePoints = computed<ScreenRoutePoint[]>(() => {
  return points.value.map((point: TripRoutebookPoint, index: number) => {
    const pointMeta = resolvePointMeta(point.pointType, index)
    const previousSegment = index > 0 ? findSegment(points.value[index - 1], point, index - 1) : undefined
    return {
      ...point,
      name: point.pointName || '未命名点位',
      type: pointMeta.label,
      distance: formatSegment(previousSegment),
      tone: pointMeta.tone,
      icon: pointMeta.icon
    }
  })
})

/**
 * 大屏允许通过 routebookId 精确进入；普通登录入口没有携带 ID 时，
 * 使用当前账号最近更新的一条路书，保证默认入口也能形成可见的数据闭环。
 */
async function loadScreenData(): Promise<void> {
  dataLoading.value = true
  dataError.value = ''
  try {
    let targetId = Number(route.query.routebookId)
    if (!targetId) {
      const page = await listRoutebooks({ pageNum: 1, pageSize: 1, orderByColumn: 'updateTime', isAsc: 'desc' })
      targetId = Number(page.rows?.[0]?.id)
    }
    if (!targetId) {
      clearScreenData()
      return
    }
    routebookId.value = targetId
    // 浏览统计独立上报，失败不影响大屏主流程
    recordRoutebookView(targetId).catch(() => undefined)
    if (Number(route.query.routebookId) !== targetId) {
      router.replace({ query: { ...route.query, routebookId: String(targetId) } })
    }
    const [detailResult, pointResult, segmentResult] = await Promise.allSettled([
      getRoutebook(targetId),
      listRoutebookPoints(targetId),
      listRoutebookSegments(targetId)
    ])
    if (detailResult.status === 'rejected') throw detailResult.reason
    if (pointResult.status === 'rejected') throw pointResult.reason
    routebook.value = detailResult.value.data
    points.value = normalizeList<TripRoutebookPoint>(pointResult.value).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    if (segmentResult.status === 'fulfilled') {
      segments.value = normalizeList<TripRoutebookSegment>(segmentResult.value).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    } else {
      segments.value = []
      console.warn('大屏分段路线加载失败，将使用点位坐标绘制简化路线。', segmentResult.reason)
    }
    selectedPoint.value = 0
    recommendationPage.value = 1
    await loadRecommendations()
    renderRoute()
  } catch (error) {
    clearScreenData()
    dataError.value = '无法读取路书详情，请检查路书、点位及分段路线接口。'
    console.warn('大屏路书数据加载失败，请检查路书详情、点位和分段路线接口。', error)
  } finally {
    dataLoading.value = false
  }
}

async function loadRecommendations(): Promise<void> {
  if (!routebookId.value) {
    recommendations.value = []
    recommendationTotal.value = 0
    return
  }
  recommendLoading.value = true
  try {
    const response = await listRecommendations({
      routebookId: routebookId.value,
      prefCode: recommendTabs[recommendTab.value].code,
      pageNum: recommendationPage.value,
      pageSize: 3,
      orderByColumn: 'finalScore',
      isAsc: 'desc'
    })
    recommendations.value = response.rows || []
    recommendationTotal.value = Number(response.total || 0)
  } catch (error) {
    recommendations.value = []
    recommendationTotal.value = 0
    console.warn('大屏推荐内容加载失败，请检查推荐列表接口。', error)
  } finally {
    recommendLoading.value = false
  }
}

/**
 * AI 搜索并刷新当前分类推荐。
 * 推荐面板列表来自推荐结果缓存表，缓存未生成时面板无数据；
 * 点击刷新按钮主动触发 Tavily 搜索落库后再拉取列表，避免面板长期空白。
 * 搜索词优先取用户输入的关键词，其次路书标题，最后回退当前分类名称。
 */
async function searchAndRefreshRecommendations(): Promise<void> {
  if (!routebookId.value) {
    ElMessage.warning('请先创建或选择路书')
    return
  }
  const queryText = keyword.value.trim() || routebook.value?.title || recommendTabs[recommendTab.value].label
  recommendLoading.value = true
  try {
    await searchRecommendations({
      routebookId: routebookId.value,
      prefCode: recommendTabs[recommendTab.value].code,
      queryText,
      searchDepth: 'basic',
      maxResults: 6
    })
    recommendationPage.value = 1
    await loadRecommendations()
    ElMessage.success('AI 搜索完成，推荐结果已更新')
  } catch (error) {
    console.warn('大屏 AI 搜索失败，请检查推荐搜索接口。', error)
    ElMessage.error('AI 搜索失败，请稍后重试')
  } finally {
    recommendLoading.value = false
  }
}

function normalizeList<T>(response: any): T[] {
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.data?.rows)) return response.data.rows
  if (Array.isArray(response?.data?.list)) return response.data.list
  return []
}

function clearScreenData(): void {
  routebookId.value = undefined
  routebook.value = undefined
  points.value = []
  segments.value = []
  recommendations.value = []
  recommendationTotal.value = 0
  clearRouteOverlays()
}

function routebookStatusLabel(status?: string): string {
  const labels: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', ARCHIVED: '已归档', DELETED: '已删除' }
  return labels[status || ''] || status || '状态未知'
}

function openRoutebookDrawer(): void {
  routebookListQuery.pageNum = 1
  routebookDrawerOpen.value = true
}

async function loadRoutebookList(): Promise<void> {
  routebookListLoading.value = true
  try {
    const response = await listRoutebooks({
      ...routebookListQuery,
      orderByColumn: 'updateTime',
      isAsc: 'desc'
    })
    routebookList.value = response.rows || []
    routebookListTotal.value = Number(response.total || 0)
  } catch (error) {
    routebookList.value = []
    routebookListTotal.value = 0
    console.warn('大屏我的路书加载失败，请检查路书分页接口。', error)
  } finally {
    routebookListLoading.value = false
  }
}

function openCreateRoutebook(): void {
  routebookForm.value = {
    title: '',
    description: '',
    status: 'DRAFT',
    visibility: 'PRIVATE',
    routeMode: 'CAR'
  }
  routebookDialogOpen.value = true
  nextTick(() => routebookFormRef.value?.clearValidate())
}

function openEditRoutebook(item: TripRoutebook | undefined = routebook.value): void {
  if (!item?.id) return
  routebookForm.value = { ...item }
  routebookDialogOpen.value = true
  nextTick(() => routebookFormRef.value?.clearValidate())
}

async function submitRoutebook(): Promise<void> {
  await routebookFormRef.value?.validate()
  routebookSubmitting.value = true
  try {
    if (routebookForm.value.id) {
      await updateRoutebook(routebookForm.value)
      routebookDialogOpen.value = false
      await loadRoutebookList()
      if (Number(routebookForm.value.id) === routebookId.value) await loadScreenData()
      ElMessage.success('路书基础信息已保存')
      return
    }
    const response = await addRoutebook({
      ...routebookForm.value,
      status: 'DRAFT',
      visibility: routebookForm.value.visibility || 'PRIVATE',
      routeMode: routebookForm.value.routeMode || 'CAR'
    })
    const createdId = await resolveChangedRoutebookId(response.data)
    if (!createdId) {
      throw new Error('创建接口未返回路书 ID，且无法从路书列表定位新建记录')
    }
    routebookDialogOpen.value = false
    routebookDrawerOpen.value = false
    await switchRoutebook(createdId)
    ElMessage.success('路书草稿已创建，请从地图搜索并添加地点')
    nextTick(enterPoiSearchMode)
  } catch (error) {
    console.warn('大屏路书创建或修改失败，请检查表单及路书接口返回。', error)
  } finally {
    routebookSubmitting.value = false
  }
}

async function resolveChangedRoutebookId(payload: number | TripRoutebook | undefined): Promise<number | undefined> {
  if (Number(payload) > 0) return Number(payload)
  if (payload && typeof payload === 'object' && Number(payload.id) > 0) return Number(payload.id)
  const response = await listRoutebooks({ pageNum: 1, pageSize: 1, orderByColumn: 'updateTime', isAsc: 'desc' })
  return Number(response.rows?.[0]?.id) || undefined
}

async function switchRoutebook(id: number): Promise<void> {
  if (!id) return
  exitPoiSearchMode()
  routebookDrawerOpen.value = false
  if (Number(route.query.routebookId) === id) {
    await loadScreenData()
    return
  }
  routebookId.value = id
  await router.replace({ query: { ...route.query, routebookId: String(id) } })
  await loadScreenData()
}

async function handleRoutebookCommand(command: string, item: TripRoutebook): Promise<void> {
  const id = Number(item.id)
  if (!id) return
  if (command === 'edit') {
    openEditRoutebook(item)
    return
  }
  if (command === 'copy') {
    const response = await copyRoutebook(id)
    const copiedId = await resolveChangedRoutebookId(response.data)
    await loadRoutebookList()
    if (copiedId) await switchRoutebook(copiedId)
    ElMessage.success('路书已复制并切换到新副本')
    return
  }
  if (command === 'publish') {
    await ElMessageBox.confirm(`确定发布“${item.title || '该路书'}”吗？`, '发布路书', { type: 'warning' })
    await publishRoutebook(id)
    ElMessage.success('路书发布成功')
  }
  if (command === 'archive') {
    await ElMessageBox.confirm(`归档后“${item.title || '该路书'}”将不再作为活动草稿，确定继续吗？`, '归档路书', { type: 'warning' })
    await archiveRoutebook(id)
    ElMessage.success('路书已归档')
  }
  if (command === 'delete') {
    await ElMessageBox.confirm(`删除“${item.title || '该路书'}”后无法在大屏继续编辑，确定删除吗？`, '删除路书', { type: 'warning' })
    await deleteRoutebook(id)
    ElMessage.success('路书已删除')
  }
  await loadRoutebookList()
  if (command === 'delete' && id === routebookId.value) {
    clearScreenData()
    const nextId = Number(routebookList.value[0]?.id)
    if (nextId) {
      await switchRoutebook(nextId)
    } else {
      await router.replace({ query: { ...route.query, routebookId: undefined } })
      applyInitialMapView()
    }
    return
  }
  if (id === routebookId.value) await loadScreenData()
}

async function saveRoutebook(): Promise<void> {
  if (!routebookId.value || !routebook.value) return
  saving.value = true
  try {
    await updateRoutebook({ ...routebook.value, id: routebookId.value })
    const result = await getRoutebook(routebookId.value)
    routebook.value = result.data || routebook.value
    ElMessage.success('路书已保存')
  } catch (error) {
    console.warn('大屏路书保存失败，请检查路书修改接口。', error)
  } finally {
    saving.value = false
  }
}

async function publishCurrentRoutebook(): Promise<void> {
  if (!routebookId.value) return
  await ElMessageBox.confirm('发布后路书将按当前可见性对外展示，确定发布吗？', '发布路书', { type: 'warning' })
  publishing.value = true
  try {
    await publishRoutebook(routebookId.value)
    const result = await getRoutebook(routebookId.value)
    routebook.value = result.data || { ...routebook.value, status: 'PUBLISHED' }
    if (routebookDrawerOpen.value) await loadRoutebookList()
    ElMessage.success('路书发布成功')
  } catch (error) {
    console.warn('大屏路书发布失败，请检查发布权限和接口返回。', error)
  } finally {
    publishing.value = false
  }
}

async function shareCurrentRoutebook(): Promise<void> {
  if (!routebookId.value) return
  try {
    const response = await createShareLink({ routebookId: routebookId.value, shareType: 'VIEW_ONLY' })
    const shareCode = response.data?.shareCode
    if (!shareCode) {
      ElMessage.warning('分享接口未返回 shareCode，无法生成分享信息')
      return
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareCode)
      ElMessage.success(`分享码 ${shareCode} 已复制`)
    } else {
      ElMessage.success(`分享码已生成：${shareCode}`)
    }
  } catch (error) {
    console.warn('大屏路书分享失败，请检查分享接口及浏览器剪贴板权限。', error)
  }
}

async function optimizeRoute(): Promise<void> {
  if (!routebookId.value) return
  optimizing.value = true
  try {
    const recalcResult = await recalculateRoutebookSegments(routebookId.value)
    const [detailResult, segmentResult] = await Promise.all([
      getRoutebook(routebookId.value),
      listRoutebookSegments(routebookId.value)
    ])
    routebook.value = detailResult.data || routebook.value
    segments.value = normalizeList<TripRoutebookSegment>(segmentResult).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    renderRoute()
    // 分段重算失败提示：失败分段不落库，把起终点与原因展示给用户（如骑行单段超过约 300km）
    const recalcData = recalcResult?.data
    const successCount = Number(recalcData?.successCount ?? 0)
    const failedCount = Number(recalcData?.failedCount ?? 0)
    if (failedCount > 0) {
      const failure = Array.isArray(recalcData?.failures) && recalcData.failures.length > 0 ? recalcData.failures[0] : null
      const hint = failure ? `${failure.from} → ${failure.to}：${failure.reason}` : `共 ${failedCount} 段计算失败`
      // 骑行单段超高高德规划上限（errcode 30007/超出限制）时给出拆分引导，提示用户补充途经点位后重算
      const isRidingOverLimit = !!failure?.reason && /30007|超出限制/.test(failure.reason)
      const tail = isRidingOverLimit
        ? '；骑行单段超过高德单次规划上限（官方宣称 500km），请在中间补充途经点位拆分后重新优化'
        : ''
      ElMessage.warning(`路线已重新计算：成功 ${successCount} 段，失败 ${failedCount} 段（${hint}）${tail}`)
    } else {
      ElMessage.success(`路线已重新计算：成功 ${successCount} 段`)
    }
  } catch (error) {
    console.warn('大屏路线重算失败，请检查分段路线重算接口。', error)
  } finally {
    optimizing.value = false
  }
}

async function handleSearch(): Promise<void> {
  if (poiSearchMode.value) {
    await searchPoiOnMap()
    return
  }
  const queryText = keyword.value.trim()
  if (!queryText) {
    ElMessage.warning('请输入地点、景点、美食或路线关键词')
    return
  }
  if (!routebookId.value) {
    ElMessage.warning('请先创建或选择路书')
    return
  }
  try {
    await searchRecommendations({
      routebookId: routebookId.value,
      prefCode: recommendTabs[recommendTab.value].code,
      queryText,
      searchDepth: 'basic',
      maxResults: 6
    })
    recommendationPage.value = 1
    await loadRecommendations()
    ElMessage.success('搜索完成，推荐结果已更新')
  } catch (error) {
    console.warn('大屏智能搜索失败，请检查推荐搜索接口。', error)
  }
}

async function addRecommendation(item: TripRecommend): Promise<void> {
  if (!item.id) return
  addingRecommendationId.value = item.id
  try {
    await addRecommendationToRoutebook(item.id, {})
    await reloadRouteAfterPointChange()
    ElMessage.success(`“${item.title || '推荐地点'}”已加入路线`)
  } catch (error) {
    console.warn('推荐内容加入路书失败，请检查推荐记录是否包含有效点位信息。', error)
  } finally {
    addingRecommendationId.value = undefined
  }
}

async function reloadRouteAfterPointChange(): Promise<void> {
  if (!routebookId.value) return
  const [detailResult, pointResult, segmentResult] = await Promise.all([
    getRoutebook(routebookId.value),
    listRoutebookPoints(routebookId.value),
    listRoutebookSegments(routebookId.value)
  ])
  routebook.value = detailResult.data || routebook.value
  points.value = normalizeList<TripRoutebookPoint>(pointResult).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  segments.value = normalizeList<TripRoutebookSegment>(segmentResult).sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
  const startName = points.value[0]?.pointName
  const endName = points.value[points.value.length - 1]?.pointName
  if (routebook.value && (routebook.value.startName !== startName || routebook.value.endName !== endName)) {
    routebook.value = { ...routebook.value, startName, endName }
    await updateRoutebook(routebook.value)
  }
  renderRoute()
}

function changeRecommendTab(index: number): void {
  recommendTab.value = index
  recommendationPage.value = 1
  loadRecommendations()
}

function changeRecommendationPage(): void {
  const pageCount = Math.ceil(recommendationTotal.value / 3)
  recommendationPage.value = recommendationPage.value >= pageCount ? 1 : recommendationPage.value + 1
  loadRecommendations()
}

function formatRecommendScore(score?: number): string {
  return score === undefined || score === null ? '暂无评分' : `推荐分 ${formatNumber(Number(score), 1)}`
}

function showUnavailable(feature: string): void {
  ElMessage.info(`${feature}所需接口尚未提供，已记录到接口需求文档`)
}

function handlePointCommand(command: string, point: TripRoutebookPoint, index: number): void {
  if (command === 'edit') {
    pointEditForm.value = { ...points.value[index] }
    pointEditDialogOpen.value = true
    return
  }
  if (command === 'delete') {
    removeRoutebookPoint(point)
    return
  }
  if (command === 'up') moveRoutebookPoint(index, index - 1)
  if (command === 'down') moveRoutebookPoint(index, index + 1)
}

/**
 * 原生拖拽只负责记录起止下标，实际排序继续复用现有后端排序与路线重算流程。
 * 拖入自身时不触发请求，拖拽结束后统一清理插入位置状态。
 */
function handlePointDragStart(event: DragEvent, index: number): void {
  draggingPointIndex.value = index
  dragOverPointIndex.value = undefined
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function handlePointDragOver(index: number): void {
  if (draggingPointIndex.value === undefined || draggingPointIndex.value === index) return
  dragOverPointIndex.value = index
}

async function handlePointDrop(toIndex: number): Promise<void> {
  const fromIndex = draggingPointIndex.value
  handlePointDragEnd()
  if (fromIndex === undefined || fromIndex === toIndex) return
  await moveRoutebookPoint(fromIndex, toIndex)
}

function handlePointDragEnd(): void {
  draggingPointIndex.value = undefined
  dragOverPointIndex.value = undefined
}

async function submitPointEdit(): Promise<void> {
  const currentRoutebookId = routebookId.value
  const pointId = Number(pointEditForm.value.id)
  if (!currentRoutebookId || !pointId) return
  if (!pointEditForm.value.pointName?.trim()) {
    ElMessage.warning('点位名称不能为空')
    return
  }
  pointEditSubmitting.value = true
  try {
    await updateRoutebookPoint(currentRoutebookId, pointId, {
      ...pointEditForm.value,
      pointName: pointEditForm.value.pointName.trim()
    })
    pointEditDialogOpen.value = false
    await reloadRouteAfterPointChange()
    ElMessage.success('点位配置已保存')
  } catch (error) {
    console.warn('大屏点位修改失败，请检查点位修改接口。', error)
  } finally {
    pointEditSubmitting.value = false
  }
}

async function removeRoutebookPoint(point: TripRoutebookPoint): Promise<void> {
  const currentRoutebookId = routebookId.value
  const pointId = Number(point.id)
  if (!currentRoutebookId || !pointId) return
  await ElMessageBox.confirm(`删除“${point.pointName || '该点位'}”后将重新计算剩余路线，确定继续吗？`, '删除点位', { type: 'warning' })
  try {
    await deleteRoutebookPoint(currentRoutebookId, pointId)
    // 后端删除点位后已联动重算分段，这里只需重新拉取最新数据
    await reloadRouteAfterPointChange()
    ElMessage.success('点位已删除')
  } catch (error) {
    console.warn('大屏点位删除失败，请检查点位删除及路线重算接口。', error)
  }
}

async function moveRoutebookPoint(fromIndex: number, toIndex: number): Promise<void> {
  if (!routebookId.value || toIndex < 0 || toIndex >= points.value.length) return
  const reordered = [...points.value]
  const [movedPoint] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, movedPoint)
  const sortPayload = reordered.map((point: TripRoutebookPoint, index: number) => ({ ...point, sortOrder: index }))
  try {
    await sortRoutebookPoints(routebookId.value, sortPayload)
    // 后端调整排序后已联动重算分段，这里只需重新拉取最新数据
    points.value = sortPayload
    selectedPoint.value = toIndex
    await reloadRouteAfterPointChange()
    ElMessage.success('点位顺序已更新')
  } catch (error) {
    console.warn('大屏点位排序失败，请检查点位排序及路线重算接口。', error)
  }
}

function handleMapTool(index: number): void {
  activeTool.value = index
  if (index === 0) openEditRoutebook()
  if (index === 1) enterPoiSearchMode()
  if (index === 2) optimizeRoute()
}

/**
 * 切换标准/卫星底图：卫星底图 + 道路网叠加层，切回时移除叠加层恢复标准底图
 */
function toggleMapLayer(): void {
  if (!mapInstance || !amap) return
  if (mapLayer.value === 'std') {
    satLayer = new amap.TileLayer.Satellite()
    roadLayer = new amap.TileLayer.RoadNet()
    mapInstance.add([satLayer, roadLayer])
    mapLayer.value = 'sat'
  } else {
    if (satLayer && roadLayer) mapInstance.remove([satLayer, roadLayer])
    satLayer = undefined
    roadLayer = undefined
    mapLayer.value = 'std'
  }
}

/** 展开/收起地图风格选择面板 */
function toggleMapStyle(): void {
  mapStyleOpen.value = !mapStyleOpen.value
}

/** 应用地图主题并记忆偏好：setMapStyle 支持 amap://styles/<内置主题> 与自定义样式 id；
 *  特殊项 “卫星·写实” 切换到真实卫星影像瓦片底图（含路网文字），最接近写实效果，不参与记忆 */
function applyMapStyle(key: string): void {
  mapStyleKey.value = key
  if (key !== 'satellite') {
    try {
      localStorage.setItem(ROADBOOK_MAP_STYLE_KEY, key)
    } catch (error) {
      console.warn('大屏保存地图风格偏好失败，本次不记忆。', error)
    }
  }
  if (!mapInstance || !amap) return
  if (key === 'satellite') {
    mapInstance.setMapStyle('amap://styles/normal')
    if (mapLayer.value !== 'sat') {
      if (!satLayer || !roadLayer) {
        satLayer = new amap.TileLayer.Satellite()
        roadLayer = new amap.TileLayer.RoadNet()
      }
      mapInstance.add([satLayer, roadLayer])
      mapLayer.value = 'sat'
    }
    mapStyleOpen.value = false
    return
  }
  if (mapLayer.value === 'sat') {
    if (satLayer && roadLayer) mapInstance.remove([satLayer, roadLayer])
    satLayer = undefined
    roadLayer = undefined
    mapLayer.value = 'std'
  }
  mapInstance.setMapStyle(`amap://styles/${key}`)
  mapStyleOpen.value = false
}

/** 天气描述到图标的映射，按关键词优先匹配 */
const WEATHER_ICON_RULES: Array<[RegExp, string]> = [
  [/晴/, '☀️'],
  [/多云/, '⛅'],
  [/阴/, '☁️'],
  [/雷阵雨|雷雨/, '⛈️'],
  [/暴雨|大雨/, '🌧️'],
  [/雨/, '🌦️'],
  [/雪/, '❄️'],
  [/雾|霾/, '🌫️']
]

/**
 * 开关天气浮层：开启时按地图中心逆地理解析城市，再查询该城市实时天气；
 * 地图移动/缩放结束后延迟刷新，避免高频逆地理请求。
 */
function toggleWeather(): void {
  weatherVisible.value = !weatherVisible.value
  if (!mapInstance || !amap) return
  if (weatherVisible.value) {
    refreshMapWeather()
    mapInstance.on('moveend', scheduleWeatherRefresh)
    mapInstance.on('zoomend', scheduleWeatherRefresh)
  } else {
    weatherInfo.value = undefined
    clearTimeout(weatherRefreshTimer)
    mapInstance.off('moveend', scheduleWeatherRefresh)
    mapInstance.off('zoomend', scheduleWeatherRefresh)
  }
}

function scheduleWeatherRefresh(): void {
  clearTimeout(weatherRefreshTimer)
  weatherRefreshTimer = window.setTimeout(() => refreshMapWeather(), 700)
}

/**
 * 逆地理解析统一入口：高德 JS API 2.0 将 v1 的 reverseGeocoder 改名为 getAddress
 * （getReGeocode 为 Web 服务 REST 接口名，客户端不适用），按版本能力依次兼容。
 */
function reverseGeocodeLocation(lnglat: number[], callback: (status: string, result: any) => void): void {
  if (!mapGeocoder) return
  if (typeof mapGeocoder.getAddress === 'function') {
    mapGeocoder.getAddress(lnglat, callback)
  } else if (typeof mapGeocoder.getReGeocode === 'function') {
    mapGeocoder.getReGeocode({ location: lnglat }, callback)
  } else {
    mapGeocoder.reverseGeocoder(lnglat, callback)
  }
}

async function refreshMapWeather(): Promise<void> {
  if (!mapInstance || !amap || !weatherVisible.value) return
  const center = mapInstance.getCenter()
  const lnglat = [center.getLng(), center.getLat()]
  let city = ''
  if (!mapGeocoder) {
    await new Promise<void>((resolve) => {
      amap.plugin('AMap.Geocoder', () => {
        mapGeocoder = new amap.Geocoder()
        resolve()
      })
    })
  }
  reverseGeocodeLocation(lnglat, (status: string, result: any) => {
    const component = result?.regeocode?.addressComponent
    if (status !== 'complete' || !component) {
      console.warn(`大屏天气浮层逆地理解析失败（status=${status}），本次跳过天气刷新。`)
      return
    }
    // 直辖市等场景 city 可能为空，依次回退到省份/区县作为展示城市
    city = component.city || component.province || component.district || ''
    if (!city) return
    if (!mapWeatherPlugin) {
      amap.plugin('AMap.Weather', () => {
        mapWeatherPlugin = new amap.Weather()
        queryLiveWeather(city)
      })
      return
    }
    queryLiveWeather(city)
  })
}

function queryLiveWeather(city: string): void {
  mapWeatherPlugin?.getLive(city, (errcode: number, data: any) => {
    if (errcode || !data) {
      console.warn(`大屏实时天气查询失败（errcode=${errcode}，城市=${city}），天气浮层暂不显示。`)
      return
    }
    const weather = data.weather || ''
    const icon = WEATHER_ICON_RULES.find(([rule]) => rule.test(weather))?.[1] || '🌤️'
    weatherInfo.value = {
      city: data.city || city,
      weather,
      temperature: data.temperature ?? '',
      windDirection: data.windDirection || '',
      windPower: data.windPower || '',
      icon
    }
  })
}

/** 开关地图选点：开启后点击地图，逆地理解析选中位置并弹出确认卡片加入路线 */
function toggleMapPick(): void {
  mapPickEnabled.value = !mapPickEnabled.value
  if (!mapInstance) return
  if (mapPickEnabled.value) {
    mapInstance.on('click', handleMapPickClick)
  } else {
    mapInstance.off('click', handleMapPickClick)
    clearPoiSearchOverlays()
    mapPickPending.value = false
    mapPickPois.value = []
    selectedPoi.value = undefined
  }
}

/** 从周边地点候选中选择某个 POI：更新选中项并把标记移动到该 POI 准确位置 */
function pickNearbyPoi(poi: PoiItem): void {
  if (!amap || !mapInstance) return
  const location = parsePoiLocation(poi.location)
  if (!location) return
  mapPickSearchCenter = location
  selectedPoi.value = { ...poi, type: poi.type || '地点' }
  clearPoiSearchOverlays()
  const markerContent = createMapMarkerContent(routePoints.value.length + 1, poi.name || '未命名地点', 'search')
  const marker = new amap.Marker({
    position: location,
    content: markerContent,
    offset: new amap.Pixel(-17, -42),
    title: poi.name
  })
  poiSearchOverlays.push(marker)
  mapInstance.add(marker)
}

/** 在选点卡片内按关键词搜索点击坐标周边的地点，兜底逆地理候选为空的情况 */
async function searchNearbyPick(): Promise<void> {
  const keyword = mapPickKeyword.value.trim()
  if (!amap || !mapPickSearchCenter.length || !keyword) return
  if (!mapPickPlaceSearch) {
    await new Promise<void>((resolve) => {
      amap.plugin('AMap.PlaceSearch', () => {
        mapPickPlaceSearch = new amap.PlaceSearch({ pageSize: 10, pageIndex: 1 })
        resolve()
      })
    })
  }
  mapPickSearching.value = true
  mapPickNoResult.value = false
  try {
    mapPickPlaceSearch.searchNearBy(keyword, mapPickSearchCenter, 5000, (status: string, result: any) => {
      mapPickSearching.value = false
      if (status !== 'complete' || !result?.poiList?.pois?.length) {
        mapPickNoResult.value = true
        mapPickPois.value = []
        return
      }
      mapPickNoResult.value = false
      mapPickPois.value = result.poiList.pois.map((p: any) => {
        const loc = p.location?.lng !== undefined
          ? [p.location.lng, p.location.lat]
          : Array.isArray(p.location)
            ? p.location
            : mapPickSearchCenter
        return {
          id: p.id || `pick-search-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: p.name,
          address: p.pname && p.cityname ? `${p.pname}${p.cityname}${p.adname || ''}${p.address || ''}` : p.address || '附近地点',
          location: `${loc[0]},${loc[1]}`,
          type: p.type || '地点'
        } as PoiItem
      })
    })
  } catch (error) {
    mapPickSearching.value = false
    console.warn(`大屏地图选点周边搜索失败：${String(error)}`)
  }
}

/** 清空选点搜索关键词与候选，回到逆地理自带候选的初始态 */
function resetNearbyPick(): void {
  mapPickPois.value = []
  mapPickNoResult.value = false
}

async function handleMapPickClick(event: any): Promise<void> {
  if (!amap || !mapInstance || !event?.lnglat) return
  // 点击落在路线点 marker 上时不进入加点流程（交给 marker 自身的详情浮层处理）
  const clickTarget = event.originEvent?.target as HTMLElement | undefined
  if (clickTarget?.closest?.('.amap-marker')) return
  const lng = event.lnglat.getLng()
  const lat = event.lnglat.getLat()
  if (!mapGeocoder) {
    await new Promise<void>((resolve) => {
      amap.plugin('AMap.Geocoder', () => {
        mapGeocoder = new amap.Geocoder()
        resolve()
      })
    })
  }
  reverseGeocodeLocation([lng, lat], (status: string, result: any) => {
    if (status !== 'complete' || !result?.regeocode) {
      console.warn(`大屏地图选点逆地理解析失败（status=${status}），该位置未加入路线。`)
      return
    }
    // 逆地理解析结果自带周边 POI 列表，取前几条作为「有名字」的候选地点
    const nearbyPois = (result.regeocode.pois || [])
      .filter((p: any) => p && p.name)
      .slice(0, 6)
      .map((p: any) => ({
        id: p.id || `poi-pick-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: p.name,
        address: p.address || result.regeocode.formattedAddress || '',
        location: p.location || `${lng},${lat}`,
        type: p.type || '地点'
      } as PoiItem))
    mapPickPois.value = nearbyPois
    // 默认取第一个命名候选（命中地点直接有名字），无候选时回退到逆地理地址
    const primary = nearbyPois[0]
    const name = primary ? primary.name : result.regeocode.formattedAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`
    const rawLoc = primary ? parsePoiLocation(primary.location) : [lng, lat]
    const pickLng = rawLoc?.[0] ?? lng
    const pickLat = rawLoc?.[1] ?? lat
    mapPickSearchCenter = [pickLng, pickLat]
    mapPickNoResult.value = false
    clearPoiSearchOverlays()
    const markerContent = createMapMarkerContent(routePoints.value.length + 1, name, 'search')
    const marker = new amap.Marker({
      position: [pickLng, pickLat],
      content: markerContent,
      offset: new amap.Pixel(-17, -42),
      title: name
    })
    poiSearchOverlays.push(marker)
    mapInstance.add(marker)
    pendingAddDayNo.value = nextAddDayNo()
    selectedPoi.value = primary ?? {
      id: `map-pick-${Date.now()}`,
      name,
      address: result.regeocode.formattedAddress || '',
      location: `${pickLng},${pickLat}`,
      type: '地图选点'
    } as PoiItem
    mapPickPending.value = true
  })
}

/** 关闭地图选点确认卡片，同时清掉选点标记与周边候选 */
function dismissPendingPoi(): void {
  mapPickPending.value = false
  mapPickPois.value = []
  selectedPoi.value = undefined
  clearPoiSearchOverlays()
}

/** 计算添加点位时的默认所属天数：取现有最大天数，没有则从第 1 天开始 */
function nextAddDayNo(): number {
  const maxDay = points.value.reduce((max: number, point: TripRoutebookPoint) => Math.max(max, Number(point.dayNo || 0)), 0)
  return maxDay > 0 ? maxDay : 1
}

/** 打开出发时间弹窗，回填当前路书已保存的时间 */
function openDepartureDialog(): void {
  if (!routebookId.value || !routebook.value) return
  departureFormValue.value = routebook.value.startDate || ''
  departureDialogOpen.value = true
}

/** 保存出发时间：合并进当前路书并更新接口与本地展示，时间变更不重算路线 */
async function saveDeparture(): Promise<void> {
  if (!routebookId.value || !routebook.value) return
  const value = departureFormValue.value || undefined
  departureSaving.value = true
  try {
    await updateRoutebook({ ...routebook.value, startDate: value })
    routebook.value = { ...routebook.value, startDate: value }
    departureDialogOpen.value = false
    ElMessage.success(value ? '出发时间已更新' : '已清除出发时间')
  } catch (error) {
    console.warn('大屏保存出发时间失败，请检查路书更新接口。', error)
  } finally {
    departureSaving.value = false
  }
}

function enterPoiSearchMode(): void {
  if (!routebookId.value) {
    ElMessage.warning('请先创建或选择路书')
    return
  }
  if (!mapInstance || mapLoading.value || mapError.value) {
    ElMessage.info('地图尚未准备完成，请稍后再添加地点')
    return
  }
  poiSearchMode.value = true
  poiSearchStatus.value = 'idle'
  poiSearchMessage.value = '输入地点关键词并按回车，搜索结果会显示在地图上'
  keyword.value = ''
  pointType.value = points.value.length === 0 ? 'START' : 'WAYPOINT'
  pointCandidates.value = []
  pendingAddDayNo.value = nextAddDayNo()
  selectedPoi.value = undefined
  clearLocationOverlays()
  locationMessage.value = ''
  clearPoiSearchOverlays()
  activeTool.value = 1
  nextTick(() => document.querySelector<HTMLInputElement>('.poi-search-form input')?.focus())
}

function exitPoiSearchMode(): void {
  if (!poiSearchMode.value && poiSearchOverlays.length === 0) return
  poiSearchMode.value = false
  poiSearchStatus.value = 'idle'
  poiSearchMessage.value = ''
  pointCandidates.value = []
  selectedPoi.value = undefined
  keyword.value = ''
  clearPoiSearchOverlays()
  if (mapInstance) applyInitialMapView()
}

async function searchPoiOnMap(): Promise<void> {
  const keywords = keyword.value.trim()
  if (!keywords) {
    ElMessage.warning('请输入地点关键词')
    return
  }
  poiSearchStatus.value = 'searching'
  poiSearchMessage.value = `正在搜索“${keywords}”…`
  pointCandidates.value = []
  selectedPoi.value = undefined
  clearPoiSearchOverlays()
  try {
    const response = await searchPoi({ keywords, pageNum: 1, pageSize: 10, showFields: 'business,photos' })
    pointCandidates.value = normalizePoiList(response.data).filter((item: PoiItem) => Boolean(parsePoiLocation(item.location)))
    if (pointCandidates.value.length === 0) {
      poiSearchStatus.value = 'empty'
      poiSearchMessage.value = `没有找到“${keywords}”的有效地图地点，请更换关键词`
      return
    }
    poiSearchStatus.value = 'results'
    poiSearchMessage.value = `找到 ${pointCandidates.value.length} 个地点，点击地图标记选择`
    renderPoiSearchResults()
  } catch (error) {
    pointCandidates.value = []
    poiSearchStatus.value = 'error'
    poiSearchMessage.value = '地点搜索失败，请检查网络后重新搜索'
    console.warn('大屏地图地点搜索失败，请检查 POI 搜索接口。', error)
  }
}

function normalizePoiList(payload: any): PoiItem[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.pois)) return payload.pois
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.rows)) return payload.rows
  return []
}

function renderPoiSearchResults(): void {
  if (!mapInstance || !amap) return
  clearPoiSearchOverlays()
  pointCandidates.value.forEach((item: PoiItem, index: number) => {
    const location = parsePoiLocation(item.location)
    if (!location) return
    const markerContent = createMapMarkerContent(index + 1, item.name || `搜索结果 ${index + 1}`, 'search')
    const marker = new amap.Marker({
      position: location,
      content: markerContent,
      offset: new amap.Pixel(-17, -42),
      title: item.name || `搜索结果 ${index + 1}`
    })
    marker.on('click', () => {
      selectedPoiMarkerElement?.classList.remove('is-selected')
      markerContent.classList.add('is-selected')
      selectedPoiMarkerElement = markerContent
      selectedPoi.value = item
      mapInstance.panTo(location, 260)
    })
    poiSearchOverlays.push(marker)
  })
  if (poiSearchOverlays.length > 0) {
    mapInstance.add(poiSearchOverlays)
    mapInstance.setFitView(poiSearchOverlays, false, [110, 370, 180, 400], 16)
    syncMapZoom()
  }
}

/**
 * 路线点和搜索候选点共用同一套竖直锚点结构，保证尖角准确落在坐标上。
 * 搜索候选点始终展示名称，路线点名称默认弱化，在悬停或选中时突出。
 */
function createMapMarkerContent(order: number, name: string, variant: 'route' | 'search'): HTMLButtonElement {
  const markerContent = document.createElement('button')
  markerContent.type = 'button'
  markerContent.className = `map-point-marker map-point-marker--${variant}`

  const pin = document.createElement('span')
  pin.className = 'map-point-marker__pin'
  const pinOrder = document.createElement('b')
  pinOrder.textContent = String(order)
  pin.appendChild(pinOrder)

  const label = document.createElement('span')
  label.className = 'map-point-marker__label'
  label.textContent = name

  markerContent.append(pin, label)
  return markerContent
}

async function addSelectedPoi(): Promise<void> {
  const item = selectedPoi.value
  if (!routebookId.value) return
  if (!item) return
  const location = parsePoiLocation(item.location)
  if (!location) {
    ElMessage.warning('该地点缺少有效坐标，暂时无法加入路线')
    return
  }
  addingPointId.value = String(item.id || 'selected')
  try {
    await addRoutebookPoint(routebookId.value, {
      pointName: item.name,
      pointType: pointType.value,
      amapPoiId: item.id,
      address: item.address,
      lng: location[0],
      lat: location[1],
      sortOrder: points.value.length,
      source: 'AMAP',
      dayNo: pendingAddDayNo.value
    })
    await reloadRouteAfterPointChange()
    // 地图选点模式：加入成功后关闭确认卡片并清理选点标记，选点开关保持开启可连续添加
    if (mapPickPending.value) {
      mapPickPending.value = false
      mapPickPois.value = []
      selectedPoi.value = undefined
      clearPoiSearchOverlays()
      ElMessage.success(`“${item.name || '地点'}”已加入路线`)
      return
    }
    pointCandidates.value = pointCandidates.value.filter((candidate: PoiItem) => candidate !== item)
    selectedPoi.value = undefined
    pointType.value = 'WAYPOINT'
    if (pointCandidates.value.length > 0) {
      poiSearchStatus.value = 'results'
      poiSearchMessage.value = `已加入路线，地图上还有 ${pointCandidates.value.length} 个候选地点`
      renderPoiSearchResults()
    } else {
      poiSearchStatus.value = 'idle'
      poiSearchMessage.value = '地点已加入路线，可以继续输入关键词搜索'
      clearPoiSearchOverlays()
    }
    ElMessage.success(`“${item.name || '地点'}”已加入路线`)
  } catch (error) {
    console.warn('大屏新增地点失败，请检查路书点位新增接口。', error)
  } finally {
    addingPointId.value = undefined
  }
}

function parsePoiLocation(location: unknown): number[] | undefined {
  if (typeof location === 'string') {
    const coordinates = location.split(',').map(Number)
    if (coordinates.length >= 2 && coordinates.every(Number.isFinite)) return coordinates.slice(0, 2)
  }
  if (location && typeof location === 'object') {
    const value = location as { lng?: number; lat?: number }
    if (Number.isFinite(Number(value.lng)) && Number.isFinite(Number(value.lat))) return [Number(value.lng), Number(value.lat)]
  }
  return undefined
}

function enterAdmin(): void {
  router.push('/index')
}

/**
 * 初始化高德地图后直接渲染后端分段路线；如果接口尚未返回 polyline，
 * 仅对缺失的相邻分段使用点位直线兜底，避免整条路线不可见。
 */
async function initializeMap(): Promise<void> {
  if (!mapContainerRef.value) return
  mapLoading.value = true
  mapError.value = ''
  locationMessage.value = ''
  try {
    amap = await loadAmap()
    destroyMap()
    mapInstance = new amap.Map(mapContainerRef.value, {
      center: [104.195397, 35.86166],
      zoom: 5,
      mapStyle: `amap://styles/${mapStyleKey.value}`,
      resizeEnable: true,
      viewMode: '2D',
      showLabel: true,
      features: ['bg', 'road', 'building', 'point']
    })
    mapInstance.addControl(new amap.Scale())
    mapInstance.on('zoomchange', syncMapZoom)
    mapLoading.value = false
    applyInitialMapView()
    // 天气与选点默认开启：进入大屏即显示实时天气、可直接点地图加点，无需先点开关
    toggleWeather()
    toggleMapPick()
  } catch (error) {
    mapLoading.value = false
    mapError.value = error instanceof Error
      ? `${error.message}，请检查地图密钥或网络后重试。`
      : '高德地图初始化失败，请检查地图密钥或网络后重试。'
    console.warn('大屏高德地图初始化失败，请检查浏览器端地图配置。', error)
  }
}

function applyInitialMapView(): void {
  if (!mapInstance) return
  clearLocationOverlays()
  if (routebookId.value && points.value.some(hasCoordinates)) {
    locationStatus.value = 'idle'
    locationMessage.value = ''
    renderRoute()
    return
  }
  mapInstance.setZoomAndCenter(5, [104.195397, 35.86166], false, 300)
  syncMapZoom()
  requestBrowserLocation()
}

function renderRoute(): void {
  if (!mapInstance || !amap) return
  clearLocationOverlays()
  clearRouteOverlays()
  const validPoints = points.value.filter((point: TripRoutebookPoint) => hasCoordinates(point))
  pointMarkers = validPoints.map((point: TripRoutebookPoint, index: number) => {
    const markerContent = createMapMarkerContent(index + 1, point.pointName || `路线点 ${index + 1}`, 'route')
    // 点击地图路线点 marker：聚焦该点并弹出点位详情浮层（可上移/下移/删除）
    markerContent.addEventListener('click', () => handleMarkerClick(index))
    const marker = new amap.Marker({
      position: [Number(point.lng), Number(point.lat)],
      content: markerContent,
      offset: new amap.Pixel(-17, -42),
      title: point.pointName || `路线点 ${index + 1}`,
    })
    marker.on('click', () => focusRoutePoint(points.value.indexOf(point)))
    return marker
  })

  const lines: any[] = []
  for (let index = 0; index < validPoints.length - 1; index += 1) {
    const from = validPoints[index]
    const to = validPoints[index + 1]
    const segment = findSegment(from, to, index)
    const segmentPath = parsePolyline(segment?.polyline)
    const path = segmentPath.length >= 2
      ? segmentPath
      : [[Number(from.lng), Number(from.lat)], [Number(to.lng), Number(to.lat)]]
    lines.push(new amap.Polyline({
      path,
      strokeColor: '#5b7cfa',
      strokeWeight: 6,
      strokeOpacity: 0.9,
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true
    }))
  }
  routeOverlays = [...lines, ...pointMarkers]
  if (routeOverlays.length > 0) {
    mapInstance.add(routeOverlays)
    mapInstance.setFitView(routeOverlays, false, [90, 360, 130, 390], 16)
    syncMapZoom()
  }
}

function focusRoutePoint(index: number): void {
  selectedPoint.value = index
  const point = points.value[index]
  if (!mapInstance || !hasCoordinates(point)) return
  mapInstance.setZoomAndCenter(Math.max(Number(mapInstance.getZoom()), 14), [Number(point.lng), Number(point.lat)], false, 300)
  syncMapZoom()
}

/** 点击地图路线点 marker：聚焦该点并弹出点位详情浮层 */
function handleMarkerClick(index: number): void {
  detailPointIndex.value = index
  focusRoutePoint(index)
}

/** 关闭地图点位详情浮层 */
function closePointDetail(): void {
  detailPointIndex.value = -1
}

/** 在地图点位详情浮层中打开编辑弹窗：复用 ⋯ 菜单里的点位编辑（名称/类型等） */
function editDetailPoint(): void {
  const point = points.value[detailPointIndex.value]
  if (!point) return
  pointEditForm.value = { ...point }
  pointEditDialogOpen.value = true
}

/** 在点位详情浮层中上移/下移该点位：移动成功后重算路线并关闭浮层（下标语义已变化） */
async function moveDetailPoint(direction: -1 | 1): Promise<void> {
  const fromIndex = detailPointIndex.value
  if (fromIndex < 0) return
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= points.value.length) return
  await moveRoutebookPoint(fromIndex, toIndex)
  detailPointIndex.value = -1
}

/** 在点位详情浮层中删除该点位：删除成功后联动重算并关闭浮层 */
async function removeDetailPoint(): Promise<void> {
  const point = points.value[detailPointIndex.value]
  if (!point) return
  detailPointIndex.value = -1
  await removeRoutebookPoint(point)
}

function hasCoordinates(point?: TripRoutebookPoint): boolean {
  return Boolean(point) && Number.isFinite(Number(point?.lng)) && Number.isFinite(Number(point?.lat))
}

function findSegment(from?: TripRoutebookPoint, to?: TripRoutebookPoint, index?: number): TripRoutebookSegment | undefined {
  const exact = segments.value.find((segment: TripRoutebookSegment) => Number(segment.fromPointId) === Number(from?.id) && Number(segment.toPointId) === Number(to?.id))
  if (exact) return exact
  return segments.value.find((segment: TripRoutebookSegment) => segment.fromPointId === undefined && segment.toPointId === undefined && Number(segment.sortOrder || 0) === Number(index))
}

function parsePolyline(polyline?: string): number[][] {
  if (!polyline) return []
  return polyline.split(/[;|]/)
    .map(item => item.trim().split(',').map(Number))
    .filter(item => item.length >= 2 && Number.isFinite(item[0]) && Number.isFinite(item[1]))
    .map(item => [item[0], item[1]])
}

function resolvePointMeta(pointType: string | undefined, index: number): { label: string; tone: string; icon: any } {
  const meta: Record<string, { label: string; tone: string; icon: any }> = {
    SCENIC: { label: '景点', tone: 'green', icon: Picture },
    FOOD: { label: '美食', tone: 'orange', icon: Food },
    HOTEL: { label: '住宿点', tone: 'purple', icon: House },
    REST: { label: '休息点', tone: 'blue', icon: Location },
    SUPPLY: { label: '补给点', tone: 'yellow', icon: OfficeBuilding },
    FUEL: { label: '加油站', tone: 'yellow', icon: OfficeBuilding },
    CHARGE: { label: '充电站', tone: 'yellow', icon: OfficeBuilding },
    REPAIR: { label: '维修点', tone: 'yellow', icon: OfficeBuilding },
    PHOTO: { label: '拍照点', tone: 'orange', icon: Camera },
    CUSTOM: { label: '自定义', tone: 'blue', icon: Location },
    WAYPOINT: { label: '途经点', tone: 'blue', icon: Location }
  }
  if (index === 0) return { label: '起点', tone: 'green', icon: Promotion }
  if (index === points.value.length - 1) return { label: '终点', tone: 'red', icon: Promotion }
  return meta[pointType || ''] || { label: pointType || '途经点', tone: 'blue', icon: Location }
}

function formatSegment(segment?: TripRoutebookSegment): string {
  if (!segment) return ''
  const parts: string[] = []
  if (Number(segment.distanceM) > 0) parts.push(formatDistance(Number(segment.distanceM)))
  if (Number(segment.durationS) > 0) parts.push(formatDuration(Number(segment.durationS)))
  return parts.join(' · ')
}

function formatDistance(distanceM: number): string {
  return `${formatNumber(distanceM / 1000, distanceM >= 100000 ? 0 : 1)}km`
}

function formatDuration(durationS: number): string {
  const hours = Math.floor(durationS / 3600)
  const minutes = Math.round((durationS % 3600) / 60)
  if (hours <= 0) return `${minutes}m`
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

function formatNumber(value: number, digits: number): string {
  return value.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

/**
 * 浏览器返回 WGS84 坐标，高德底图使用 GCJ-02；仅在没有路书路线时申请定位，
 * 防止定位回调覆盖已加载的路线视野。
 */
function requestBrowserLocation(): void {
  if (!mapInstance || poiSearchMode.value || points.value.some((point: TripRoutebookPoint) => hasCoordinates(point)) || locationStatus.value === 'locating') return
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    locationStatus.value = 'error'
    locationMessage.value = '浏览器定位需要 HTTPS 环境，请使用安全地址访问后重试。'
    return
  }
  if (!navigator.geolocation) {
    locationStatus.value = 'error'
    locationMessage.value = '当前浏览器不支持定位，请更换浏览器或检查系统定位服务。'
    return
  }
  locationStatus.value = 'locating'
  locationMessage.value = '正在申请浏览器定位权限…'
  navigator.geolocation.getCurrentPosition(async position => {
    if (poiSearchMode.value || points.value.some((point: TripRoutebookPoint) => hasCoordinates(point)) || !mapInstance) return
    const center = await convertGpsPosition([position.coords.longitude, position.coords.latitude])
    if (poiSearchMode.value || points.value.some((point: TripRoutebookPoint) => hasCoordinates(point)) || !mapInstance) return
    clearLocationOverlays()
    const marker = new amap.Marker({ position: center, title: '当前位置', anchor: 'bottom-center' })
    const accuracyCircle = new amap.Circle({
      center,
      radius: Math.max(position.coords.accuracy || 0, 20),
      strokeColor: '#4ba3ff',
      strokeOpacity: 0.75,
      strokeWeight: 1,
      fillColor: '#4ba3ff',
      fillOpacity: 0.12
    })
    locationOverlays = [accuracyCircle, marker]
    mapInstance.add(locationOverlays)
    mapInstance.setZoomAndCenter(15, center, false, 400)
    syncMapZoom()
    locationStatus.value = 'ready'
    locationMessage.value = `已定位当前位置，精度约 ${Math.round(position.coords.accuracy || 0)} 米`
  }, error => {
    if (poiSearchMode.value || points.value.some((point: TripRoutebookPoint) => hasCoordinates(point)) || !mapInstance) return
    locationStatus.value = 'error'
    const errorMessages: Record<number, string> = {
      1: '定位权限已被拒绝，请在浏览器地址栏中允许位置权限后重试。',
      2: '暂时无法获取当前位置，请检查系统定位服务或网络后重试。',
      3: '获取当前位置超时，请移动到信号较好的位置后重试。'
    }
    locationMessage.value = errorMessages[error.code] || '浏览器定位失败，请检查位置权限后重试。'
    console.warn('大屏浏览器定位失败，地图已回退到全国视野。', error)
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 })
}

function convertGpsPosition(position: number[]): Promise<any> {
  if (!amap?.convertFrom) return Promise.resolve(position)
  return new Promise(resolve => {
    amap.convertFrom(position, 'gps', (status: string, result: any) => {
      resolve(status === 'complete' && result?.locations?.[0] ? result.locations[0] : position)
    })
  })
}

function changeMapZoom(step: number): void {
  if (!mapInstance) return
  mapInstance.setZoom(Math.min(18, Math.max(3, Number(mapInstance.getZoom()) + step)))
  syncMapZoom()
}

function syncMapZoom(): void {
  if (mapInstance) zoom.value = Math.round(Number(mapInstance.getZoom()))
}

function clearLocationOverlays(): void {
  if (mapInstance && locationOverlays.length > 0) mapInstance.remove(locationOverlays)
  locationOverlays = []
}

function clearRouteOverlays(): void {
  if (mapInstance && routeOverlays.length > 0) mapInstance.remove(routeOverlays)
  routeOverlays = []
  pointMarkers = []
}

function clearPoiSearchOverlays(): void {
  if (mapInstance && poiSearchOverlays.length > 0) mapInstance.remove(poiSearchOverlays)
  poiSearchOverlays = []
  selectedPoiMarkerElement = undefined
}

function destroyMap(): void {
  if (mapInstance) {
    mapInstance.off('zoomchange', syncMapZoom)
    mapInstance.destroy()
  }
  mapInstance = undefined
  locationOverlays = []
  routeOverlays = []
  pointMarkers = []
  poiSearchOverlays = []
}

function handleScreenKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && poiSearchMode.value) exitPoiSearchMode()
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    document.querySelector<HTMLInputElement>(poiSearchMode.value ? '.poi-search-form input' : '.global-search input')?.focus()
  }
}

watch(() => route.query.routebookId, (value: unknown) => {
  if (Number(value) !== Number(routebookId.value)) loadScreenData()
})
onMounted(async () => {
  window.addEventListener('keydown', handleScreenKeydown)
  await Promise.all([loadScreenData(), nextTick(initializeMap)])
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleScreenKeydown)
  destroyMap()
})
</script>

<style scoped lang="scss">
.roadbook-screen {
  --screen-primary: var(--roadbook-primary, #5b7cfa);
  --screen-panel: color-mix(in srgb, var(--roadbook-panel-bg) 97%, transparent);
  --screen-panel-soft: color-mix(in srgb, var(--roadbook-panel-muted) 98%, transparent);
  --screen-border: var(--roadbook-border, #edf0f7);
  --screen-text: var(--roadbook-text-primary, #182033);
  --screen-muted: var(--roadbook-text-secondary, #8a94a8);
  width: 100vw;
  min-width: 1180px;
  height: 100vh;
  min-height: 760px;
  overflow: hidden;
  color: var(--screen-text);
  background: var(--roadbook-page-bg, #f5f7fc);
  font-family: "DIN Alternate", "Bahnschrift", "PingFang SC", "Microsoft YaHei", sans-serif;
}

button,
input {
  font: inherit;
}

button {
  color: inherit;
}

.screen-header {
  position: relative;
  z-index: 20;
  display: grid;
  height: 64px;
  padding: 0 20px;
  grid-template-columns: 240px minmax(320px, 420px) minmax(590px, 1fr);
  align-items: center;
  gap: 18px;
  border-bottom: 1px solid var(--roadbook-border);
  background: color-mix(in srgb, var(--roadbook-panel-bg) 99%, transparent);
  box-shadow: var(--roadbook-shadow);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-mark {
  width: 32px;
  color: var(--screen-primary);
}

.brand-mark svg {
  display: block;
  width: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
}

.brand strong,
.brand small {
  display: block;
}

.brand strong {
  letter-spacing: 1.4px;
  font-size: 18px;
  line-height: 1.1;
}

.brand small {
  margin-top: 3px;
  color: var(--screen-muted);
  font-size: 11px;
  letter-spacing: 0.6px;
}

.global-search {
  display: grid;
  height: 42px;
  padding: 0 13px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  border: 1px solid color-mix(in srgb, var(--screen-primary) 24%, var(--screen-border));
  border-radius: 11px;
  color: color-mix(in srgb, var(--screen-primary) 72%, var(--roadbook-text-regular));
  background: var(--roadbook-panel-bg);
  box-shadow: 0 5px 16px rgba(45, 70, 130, 0.08);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.global-search:focus-within {
  border-color: var(--screen-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--screen-primary) 13%, transparent), 0 8px 20px rgba(45, 70, 130, 0.12);
}

.global-search input {
  width: 100%;
  border: 0;
  outline: 0;
  color: var(--roadbook-text-regular);
  background: transparent;
}

.global-search input::placeholder {
  color: color-mix(in srgb, var(--screen-muted) 88%, transparent);
}

.global-search kbd {
  padding: 2px 5px;
  border: 1px solid var(--screen-border);
  border-radius: 5px;
  color: var(--screen-muted);
  font-size: 10px;
}

.global-search--mode {
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 7%, var(--roadbook-panel-bg));
  box-shadow: none;
}

.global-search--mode span {
  color: var(--roadbook-text-regular);
  font-size: 13px;
}

.header-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 5px;
}

.header-actions button,
.route-heading button,
.recommend-heading button {
  display: inline-flex;
  border: 0;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
}

.header-actions button {
  height: 38px;
  padding: 0 12px;
  gap: 7px;
  border-radius: 8px;
  color: var(--roadbook-text-regular);
  font-size: 13px;
  transition: 0.2s ease;
}

.header-actions button:hover,
.header-actions button.active {
  background: color-mix(in srgb, var(--screen-primary) 7%, transparent);
}

.header-actions button.active {
  color: var(--screen-primary);
}

.header-actions .admin-entry {
  margin-left: 4px;
  border: 1px solid var(--screen-border);
  color: var(--roadbook-text-regular);
  background: var(--roadbook-panel-bg);
}

.header-actions .admin-entry:hover {
  border-color: color-mix(in srgb, var(--screen-primary) 45%, var(--screen-border));
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 6%, var(--roadbook-panel-bg));
}

.header-actions .outlined {
  margin-left: 4px;
  padding-inline: 14px;
  border: 1px solid var(--screen-border);
}

.header-actions .publish {
  margin-left: 4px;
  padding-inline: 16px;
  color: #ffffff;
  background: var(--screen-primary);
  font-weight: 700;
}

.header-actions .publish:hover {
  background: color-mix(in srgb, var(--screen-primary) 88%, #ffffff);
}

.avatar {
  width: 34px;
  height: 34px;
  margin-left: 6px;
  border: 2px solid var(--screen-border);
  border-radius: 50%;
  object-fit: cover;
}

.screen-workspace {
  position: relative;
  height: calc(100vh - 64px);
  min-height: 696px;
  overflow: hidden;
  background: var(--roadbook-page-bg, #f5f7fc);
}

.screen-workspace::before {
  display: none;
}

.glass-panel {
  border: 1px solid var(--screen-border);
  background: var(--screen-panel);
  box-shadow: 0 12px 36px rgba(50, 65, 100, 0.16);
  backdrop-filter: blur(18px);
}

.route-panel {
  position: absolute;
  z-index: 8;
  top: 20px;
  bottom: 20px;
  left: 12px;
  display: flex;
  width: 316px;
  min-height: 510px;
  border-color: #e4e9f2;
  border-radius: 12px;
  flex-direction: column;
  overflow: hidden;
  background: var(--roadbook-panel-bg);
  box-shadow: 0 10px 28px rgba(45, 62, 100, 0.12);
}

.route-heading {
  padding: 12px 16px 8px;
}

.route-heading-main,
.route-meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.route-title-row {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 6px;
}

.route-heading h1 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  flex: 1;
  color: #172033;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-heading button {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 4px;
  flex: none;
  border-radius: 7px;
  place-items: center;
  color: var(--screen-muted);
}

.route-heading button:hover {
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 7%, transparent);
}

.route-meta {
  margin-top: 8px;
}

.route-meta p {
  display: flex;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  flex: 1;
  align-items: center;
  gap: 8px;
  color: #667085;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-status {
  padding: 3px 7px;
  flex: none;
  border-radius: 5px;
  color: #4f6bff;
  background: #eef2ff;
  font-weight: 600;
}

.route-summary {
  display: grid;
  margin: 0 12px;
  padding: 7px 0;
  border-radius: 10px;
  grid-template-columns: repeat(3, 1fr);
  background: #f6f8fc;
}

.route-summary div {
  position: relative;
  text-align: center;
}

.route-summary div + div::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 1px;
  height: 20px;
  content: "";
  background: #e4e9f2;
  transform: translateY(-50%);
}

.route-summary strong,
.route-summary span {
  display: block;
}

.route-summary strong {
  color: #172033;
  font-size: 13px;
  font-weight: 600;
}

.route-summary span {
  margin-top: 2px;
  color: #667085;
  font-size: 11px;
}

.departure-chip {
  display: inline-flex;
  max-width: 150px;
  height: 24px;
  padding: 0 10px;
  flex: none;
  align-items: center;
  gap: 4px;
  border: 1px solid color-mix(in srgb, var(--screen-primary) 22%, var(--screen-border));
  border-radius: 999px;
  color: color-mix(in srgb, var(--screen-primary) 78%, var(--roadbook-text-regular));
  background: color-mix(in srgb, var(--screen-primary) 6%, var(--roadbook-panel-bg));
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}

.departure-chip:hover {
  border-color: color-mix(in srgb, var(--screen-primary) 55%, var(--screen-border));
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 10%, var(--roadbook-panel-bg));
}

.departure-chip .el-icon {
  font-size: 13px;
}

.departure-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-tabs {
  display: grid;
  margin: 4px 12px 8px;
  padding: 3px;
  border: 1px solid var(--screen-border);
  border-radius: 10px;
  grid-template-columns: 1fr 1fr;
  background: color-mix(in srgb, var(--screen-primary) 4%, transparent);
}

.route-tabs button {
  height: 30px;
  border: 0;
  border-radius: 8px;
  color: #667085;
  cursor: pointer;
  background: transparent;
  font-size: 12px;
  transition: color 0.2s ease, background 0.2s ease;
}

.route-tabs button:hover {
  color: var(--screen-primary);
}

.route-tabs button.active {
  border: 0;
  color: var(--screen-primary);
  background: var(--roadbook-panel-bg);
  box-shadow: 0 1px 4px rgb(15 23 42 / 10%);
  font-weight: 700;
}

.route-list-wrap {
  min-height: 0;
  padding: 12px 8px 10px;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.route-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.route-list-wrap::-webkit-scrollbar {
  width: 3px;
}

.route-list-wrap::-webkit-scrollbar-thumb {
  border-radius: 4px;
  background: var(--screen-muted);
}

.route-list li {
  position: relative;
  display: grid;
  min-height: 98px;
  padding: 0 0 10px;
  grid-template-columns: 30px minmax(0, 1fr);
  align-items: start;
  gap: 6px;
  cursor: pointer;
}

.route-list li::before {
  position: absolute;
  top: 25px;
  bottom: -1px;
  left: 14px;
  width: 1px;
  content: "";
  background: #dfe5ef;
}

.timeline-order {
  position: relative;
  z-index: 1;
  display: grid;
  width: 26px;
  height: 26px;
  margin: 10px 0 0 1px;
  border: 3px solid var(--roadbook-panel-bg);
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: #94a3b8;
  box-shadow: 0 2px 6px rgba(71, 85, 105, 0.18);
  font-size: 11px;
  font-weight: 700;
}

.timeline-order--green { background: var(--roadbook-success); }
.timeline-order--orange,
.timeline-order--yellow,
.timeline-order--red { background: var(--roadbook-warning); }
.timeline-order.active { background: #4f6bff; }

.node-card {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  min-height: 88px;
  padding: 10px 12px 9px;
  border: 1px solid #e4e9f2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(45, 62, 100, 0.06);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
}

.node-card::before {
  position: absolute;
  top: 17px;
  left: -6px;
  width: 10px;
  height: 10px;
  border-bottom: 1px solid #e4e9f2;
  border-left: 1px solid #e4e9f2;
  content: "";
  background: #fff;
  transform: rotate(45deg);
}

.route-list li:hover .node-card,
.route-list li.selected .node-card {
  border-color: color-mix(in srgb, #4f6bff 45%, #e4e9f2);
  box-shadow: 0 5px 14px rgba(45, 62, 100, 0.1);
}

.route-list li:hover .node-card {
  transform: translateY(-1px);
}

.route-list li.selected .node-card {
  box-shadow: inset 3px 0 0 #4f6bff, 0 5px 14px rgba(45, 62, 100, 0.1);
}

.route-list li.dragging {
  opacity: 0.48;
}

.route-list li.drop-target::after {
  position: absolute;
  z-index: 3;
  top: -6px;
  right: 0;
  left: 36px;
  height: 2px;
  border-radius: 2px;
  content: "";
  background: #4f6bff;
}

.node-card header,
.node-card footer,
.node-card p {
  display: flex;
  align-items: center;
}

.node-card header {
  min-width: 0;
  justify-content: space-between;
  gap: 10px;
}

.node-card header strong {
  min-width: 0;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card p {
  min-width: 0;
  margin: 6px 0 7px;
  gap: 6px;
  color: #667085;
  font-size: 11px;
}

.node-card p .el-icon {
  flex: none;
  color: var(--screen-primary);
  font-size: 14px;
}

.node-card p span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-card footer {
  justify-content: space-between;
}

.node-card footer button {
  padding: 0;
  border: 0;
  color: #667085;
  cursor: pointer;
  background: transparent;
  font-size: 11px;
}

.node-type {
  padding: 1px 6px;
  border: 1px solid currentColor;
  border-radius: 5px;
  font-size: 10px;
  line-height: 15px;
}

.node-type--green { color: #22a06b; background: #effaf5; }
.node-type--blue { color: #667085; background: #f2f4f7; }
.node-type--purple { color: var(--roadbook-secondary); }
.node-type--orange,
.node-type--yellow,
.node-type--red { color: #d97706; background: #fff7ed; }

.node-card-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 2px;
}

/* 拖拽手柄、快捷上移/下移、更多菜单统一为圆角图标按钮：深色图标 + 浅灰底板，
   确保在白色卡片上清晰可见（避免图标颜色继承异常而显示为白色/透明） */
.node-card-actions .el-icon {
  border-radius: 6px;
  padding: 5px 6px;
  color: #434d62;
  background: #eef1f6;
  cursor: pointer;
  font-size: 15px;
  transition: color 0.15s ease, background 0.15s ease;
}

/* 显式锁定图标 SVG 尺寸、禁止 flex 收缩，避免图标被压扁成细条（表现为“一根 -”）
   工具栏图标有自己的 20px 规则不受影响 */
.node-card-actions .el-icon svg {
  width: 15px;
  height: 15px;
  flex: none;
}

.node-card-actions .el-icon:hover {
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 12%, #ffffff);
}

.node-card-actions .node-delete {
  color: #e5484d;
  background: #fdeeef;
}

.node-card-actions .node-delete:hover {
  color: #e5484d;
  background: color-mix(in srgb, #e5484d 14%, #ffffff);
}

.node-drag-handle {
  cursor: grab;
}

.node-drag-handle:active {
  cursor: grabbing;
}

.node-move.is-disabled {
  color: #cbd2e0;
  cursor: not-allowed;
  opacity: 0.6;
}

.node-move.is-disabled:hover {
  color: #cbd2e0;
  background: transparent;
}

.point-more:hover {
  color: var(--screen-primary);
}

.route-add-prompt {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 50px;
  padding: 0 0 0 36px;
  border: 0;
  align-items: center;
  color: var(--screen-muted);
  cursor: pointer;
  background: transparent;
  text-align: left;
}

.route-add-prompt::before {
  position: absolute;
  top: -16px;
  bottom: 25px;
  left: 14px;
  width: 1px;
  content: "";
  background: #dfe5ef;
}

.route-add-prompt > span {
  position: absolute;
  z-index: 1;
  top: 9px;
  left: 0;
  display: grid;
  width: 28px;
  height: 28px;
  border: 1px solid color-mix(in srgb, var(--screen-primary) 22%, var(--screen-border));
  border-radius: 50%;
  place-items: center;
  color: var(--screen-primary);
  background: var(--roadbook-panel-bg);
}

.route-add-prompt strong {
  color: #667085;
  font-size: 12px;
  font-weight: 500;
}

.route-list-state {
  display: flex;
  min-height: 190px;
  padding: 20px 16px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #667085;
  text-align: center;
}

.route-list-state > .el-icon {
  margin-bottom: 10px;
  color: #4f6bff;
  font-size: 26px;
}

.route-list-state strong {
  color: #172033;
  font-size: 14px;
}

.route-list-state p {
  margin: 8px 0 14px;
  font-size: 12px;
  line-height: 1.6;
}

.route-list-state button {
  height: 32px;
  padding: 0 12px;
  border: 1px solid #cfd7e6;
  border-radius: 8px;
  color: #4f6bff;
  cursor: pointer;
  background: #fff;
  font-size: 12px;
}

.route-list-state--error > .el-icon {
  color: var(--roadbook-danger);
}

.route-list-skeleton {
  display: grid;
  gap: 12px;
}

.route-list-skeleton article {
  position: relative;
  height: 96px;
  margin-left: 36px;
  padding: 14px;
  border: 1px solid #e4e9f2;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
}

.route-list-skeleton article::after {
  position: absolute;
  inset: 0;
  content: "";
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.72), transparent);
  transform: translateX(-100%);
  animation: route-skeleton-loading 1.3s infinite;
}

.route-list-skeleton span,
.route-list-skeleton i,
.route-list-skeleton small {
  display: block;
  height: 10px;
  margin-bottom: 10px;
  border-radius: 5px;
  background: #edf1f7;
}

.route-list-skeleton span { width: 68%; height: 14px; }
.route-list-skeleton i { width: 86%; }
.route-list-skeleton small { width: 32%; margin: 0; }

@keyframes route-skeleton-loading {
  to { transform: translateX(100%); }
}

.overview-copy {
  padding: 30px 22px;
  flex: 1;
}

.overview-copy span {
  color: var(--screen-primary);
  font-size: 11px;
  letter-spacing: 2px;
}

.overview-copy h2 {
  margin: 13px 0;
  font-size: 18px;
  line-height: 1.55;
}

.overview-copy p {
  margin: 0;
  color: var(--screen-muted);
  font-size: 12px;
  line-height: 1.8;
}

.route-footer {
  position: relative;
  z-index: 2;
  display: grid;
  padding: 14px 18px 16px;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  border-top: 1px solid #e4e9f2;
  background: #fff;
}

.route-footer::before {
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 22px;
  pointer-events: none;
  content: "";
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #fff);
}

.route-footer button {
  display: flex;
  height: 40px;
  border: 1px solid #d8deea;
  border-radius: 9px;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: #667085;
  cursor: pointer;
  background: #fff;
  font-size: 12px;
}

.route-footer .primary-soft {
  border-color: #4f6bff;
  color: #fff;
  background: #4f6bff;
}

.map-toolbar {
  position: absolute;
  z-index: 7;
  top: 32px;
  left: 316px;
  width: 64px;
  padding: 7px;
  border-radius: 13px;
}

.map-toolbar button {
  position: relative;
  display: flex;
  width: 100%;
  height: 60px;
  border: 0;
  border-radius: 8px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--roadbook-text-regular);
  cursor: pointer;
  background: transparent;
  font-size: 10px;
  line-height: 14px;
}

.map-toolbar button:hover {
  background: color-mix(in srgb, var(--screen-primary) 6%, transparent);
}

.map-toolbar button.active {
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 10%, var(--roadbook-panel-bg));
  box-shadow: inset 3px 0 0 var(--screen-primary);
}

.map-toolbar-tools button:not(:last-child)::after,
.map-toolbar-toggles button:not(:last-child)::after {
  position: absolute;
  right: 9px;
  bottom: 0;
  left: 9px;
  height: 1px;
  content: "";
  background: var(--screen-border);
}

/* 工具栏第二组开关（卫星图/天气/选点/风格）与功能按钮分组，用分隔线区隔 */
.map-toolbar-toggles {
  position: relative;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid var(--screen-border);
}

/* 地图风格选择面板：从工具栏右缘向右展开到地图区，避免向左溢出被左侧路书面板遮住 */
.map-style-panel {
  position: absolute;
  z-index: 30;
  top: calc(100% + 8px);
  left: calc(100% + 8px);
  width: 232px;
  padding: 12px;
  border-radius: 12px;
}

.map-style-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.map-style-panel__head strong {
  color: #182033;
  font-size: 13px;
}

.map-style-panel__head button {
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 6px;
  color: #68748a;
  background: #f0f3f8;
  cursor: pointer;
  line-height: 1;
}

.map-style-panel__head button:hover {
  color: #e5484d;
  background: #fdeeef;
}

.map-style-panel__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.map-style-panel__grid button {
  display: flex;
  padding: 6px 0 5px;
  border: 1px solid transparent;
  border-radius: 8px;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: transparent;
  cursor: pointer;
}

.map-style-panel__grid button:hover {
  border-color: color-mix(in srgb, var(--screen-primary) 40%, transparent);
}

.map-style-panel__grid button.selected {
  border-color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 6%, #ffffff);
}

.map-style-swatch {
  width: 44px;
  height: 26px;
  border: 1px solid rgba(24, 32, 51, 0.08);
  border-radius: 6px;
}

.map-style-name {
  color: #3c4a5d;
  font-size: 11px;
}

.map-toolbar-toggles button {
  height: 52px;
}

.map-toolbar .el-icon {
  display: grid;
  width: 22px;
  height: 22px;
  place-items: center;
  font-size: 20px;
}

.map-toolbar button > span {
  display: block;
  white-space: nowrap;
}

.map-stage {
  position: absolute;
  z-index: 2;
  inset: 0;
  overflow: hidden;
}

.amap-container {
  position: absolute;
  inset: 0;
}

.map-feedback {
  position: absolute;
  z-index: 14;
  top: 50%;
  left: 50%;
  display: flex;
  width: min(360px, calc(100% - 48px));
  padding: 24px;
  border: 1px solid var(--screen-border);
  border-radius: 12px;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--screen-panel);
  box-shadow: var(--roadbook-shadow);
  transform: translate(-50%, -50%);
  backdrop-filter: blur(16px);
}

.map-feedback .el-icon {
  margin-bottom: 4px;
  color: var(--screen-primary);
  font-size: 28px;
}

.map-feedback strong {
  font-size: 15px;
}

.map-feedback span {
  color: var(--screen-muted);
  font-size: 12px;
  line-height: 1.6;
  text-align: center;
}

.map-feedback button,
.location-feedback button {
  height: 32px;
  padding: 0 13px;
  border: 1px solid color-mix(in srgb, var(--screen-primary) 55%, transparent);
  border-radius: 8px;
  color: var(--screen-primary);
  cursor: pointer;
  background: color-mix(in srgb, var(--screen-primary) 8%, transparent);
}

.location-feedback {
  position: absolute;
  z-index: 12;
  top: 14px;
  left: 50%;
  display: flex;
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid var(--screen-border);
  border-radius: 8px;
  align-items: center;
  gap: 8px;
  color: var(--roadbook-text-regular);
  background: var(--screen-panel);
  box-shadow: var(--roadbook-shadow);
  transform: translateX(-50%);
  backdrop-filter: blur(12px);
}

.location-feedback span {
  font-size: 12px;
}

.location-feedback--error {
  border-color: color-mix(in srgb, var(--roadbook-warning) 45%, transparent);
}

.location-feedback--ready {
  border-color: color-mix(in srgb, var(--roadbook-success) 45%, transparent);
}

.map-controls {
  position: absolute;
  z-index: 6;
  bottom: 178px;
  left: 322px;
  display: flex;
  width: 52px;
  border-radius: 10px;
  flex-direction: column;
  overflow: hidden;
}

.map-controls button {
  height: 42px;
  border: 0;
  color: var(--roadbook-text-regular);
  cursor: pointer;
  background: transparent;
  font-size: 18px;
}

.map-controls span {
  color: var(--screen-muted);
  font-size: 9px;
  text-align: center;
}

/* 天气浮层：半透明玻璃卡片展示地图中心城市的实时天气，固定在地图右上角 */
.map-weather {
  position: absolute;
  z-index: 6;
  top: 20px;
  right: 20px;
  display: flex;
  min-width: 150px;
  padding: 8px 12px;
  border-radius: 12px;
  align-items: center;
  gap: 9px;
}

.map-weather-icon {
  font-size: 24px;
  line-height: 1;
}

.map-weather-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.map-weather-meta strong {
  color: var(--roadbook-text-primary);
  font-size: 13px;
  line-height: 18px;
}

.map-weather-meta small {
  color: var(--screen-muted);
  font-size: 11px;
  line-height: 15px;
}

.locate-button {
  position: absolute;
  z-index: 6;
  bottom: 126px;
  left: 322px;
  display: grid;
  width: 52px;
  height: 46px;
  border-radius: 10px;
  place-items: center;
  color: var(--roadbook-text-regular);
  cursor: pointer;
  font-size: 20px;
}

.locate-button.locating {
  color: var(--screen-primary);
  pointer-events: none;
}

.recommend-panel {
  position: absolute;
  z-index: 8;
  top: 20px;
  right: 16px;
  bottom: 20px;
  display: flex;
  width: 336px;
  min-height: 510px;
  border-radius: 12px;
  flex-direction: column;
  overflow: hidden;
}

.recommend-heading {
  display: flex;
  height: 56px;
  padding: 0 18px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--screen-border);
}

.recommend-heading h2 {
  display: flex;
  margin: 0;
  align-items: center;
  gap: 8px;
  font-size: 16px;
}

.recommend-heading h2 span {
  margin: 0;
}

.recommend-heading h2 .el-icon {
  color: var(--screen-primary);
}

.recommend-heading button {
  color: var(--screen-muted);
  cursor: pointer;
  font-size: 17px;
}

.recommend-tabs {
  display: grid;
  height: 58px;
  padding: 0 8px;
  grid-template-columns: repeat(5, 1fr);
}

.recommend-tabs button {
  position: relative;
  display: flex;
  border: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  color: var(--screen-muted);
  cursor: pointer;
  background: transparent;
  font-size: 10px;
}

.recommend-tabs button.active {
  color: var(--screen-primary);
}

.recommend-tabs button.active::after {
  position: absolute;
  right: 13px;
  bottom: 0;
  left: 13px;
  height: 2px;
  border-radius: 2px;
  content: "";
  background: var(--screen-primary);
}

.recommend-tabs .el-icon {
  font-size: 18px;
}

.recommend-list {
  display: grid;
  min-height: 0;
  padding: 7px 11px 0;
  gap: 9px;
  flex: 1;
  overflow: auto;
}

.recommend-list article {
  position: relative;
  display: grid;
  min-height: 146px;
  padding: 9px;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 11px;
  border-radius: 10px;
  background: var(--screen-panel-soft);
}

.recommend-image {
  position: relative;
  border-radius: 7px;
  overflow: hidden;
  background-image: url("@/assets/screen/recommendation-sprite.png");
  background-repeat: no-repeat;
  background-size: 300% 100%;
}

.recommend-image::after {
  position: absolute;
  inset: 50% 0 0;
  content: "";
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.72));
}

.recommend-image span {
  position: absolute;
  z-index: 1;
  bottom: 7px;
  left: 8px;
  font-size: 10px;
}

.recommend-copy h3 {
  margin: 6px 0 7px;
  overflow: hidden;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recommend-copy p {
  margin: 0;
  color: var(--screen-muted);
  font-size: 10px;
}

.rating {
  display: flex;
  margin-top: 11px;
  gap: 8px;
  align-items: center;
}

.rating strong {
  color: var(--screen-text);
  font-size: 11px;
}

.rating span {
  color: var(--screen-muted);
  font-size: 9px;
}

.recommend-copy small {
  display: inline-block;
  margin-top: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  color: var(--screen-muted);
  background: var(--roadbook-panel-muted);
  font-size: 9px;
}

.recommend-list article > button {
  position: absolute;
  right: 9px;
  bottom: 10px;
  height: 29px;
  padding: 0 9px;
  border: 1px solid color-mix(in srgb, var(--screen-primary) 65%, transparent);
  border-radius: 7px;
  color: var(--screen-primary);
  cursor: pointer;
  background: transparent;
  font-size: 10px;
}

.recommend-list article > button:hover {
  color: #fff;
  background: var(--screen-primary);
}

.change-batch {
  display: flex;
  height: 50px;
  border: 0;
  align-items: center;
  justify-content: center;
  gap: 7px;
  color: var(--roadbook-text-regular);
  cursor: pointer;
  background: transparent;
  font-size: 12px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.recommend-empty {
  display: grid;
  min-height: 0;
  flex: 1;
  place-items: center;
  color: var(--screen-muted);
  font-size: 12px;
}

.routebook-drawer-header {
  display: flex;
  width: 100%;
  padding-right: 8px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.routebook-drawer-header strong,
.routebook-drawer-header span {
  display: block;
}

.routebook-drawer-header strong {
  color: var(--roadbook-text-primary);
  font-size: 18px;
}

.routebook-drawer-header span {
  margin-top: 5px;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
}

.routebook-list-state {
  display: flex;
  min-height: 360px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--roadbook-text-secondary);
}

.routebook-card-list {
  display: grid;
  margin-bottom: 18px;
  gap: 10px;
}

.routebook-card-list article {
  display: grid;
  padding: 5px 5px 5px 14px;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  border: 1px solid var(--roadbook-border);
  border-radius: 11px;
  background: var(--roadbook-panel-bg);
}

.routebook-card-list article.active {
  border-color: var(--roadbook-primary);
  background: color-mix(in srgb, var(--roadbook-primary) 7%, var(--roadbook-panel-bg));
}

.routebook-card-main {
  min-width: 0;
  padding: 10px 0;
  border: 0;
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.routebook-card-main strong,
.routebook-card-main span,
.routebook-card-main small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.routebook-card-main strong {
  color: var(--roadbook-text-primary);
  font-size: 14px;
}

.routebook-card-main span {
  margin-top: 7px;
  color: var(--roadbook-text-secondary);
  font-size: 11px;
}

.routebook-card-main small {
  margin-top: 6px;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
}

.routebook-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.routebook-form-grid :deep(.el-select),
.routebook-form-grid :deep(.el-input-number) {
  width: 100%;
}

.poi-search-panel {
  position: absolute;
  z-index: 13;
  top: 14px;
  left: 50%;
  width: min(560px, calc(100% - 820px));
  min-width: 440px;
  padding: 7px 9px 8px;
  border-color: color-mix(in srgb, var(--screen-primary) 26%, var(--screen-border));
  border-radius: 13px;
  transform: translateX(-50%);
}

.poi-search-form {
  display: grid;
  min-height: 38px;
  padding: 0 3px 0 5px;
  grid-template-columns: 22px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
}

.poi-search-form .el-icon {
  color: var(--screen-primary);
  font-size: 17px;
}

.poi-search-form input {
  min-width: 0;
  border: 0;
  outline: 0;
  color: var(--roadbook-text-regular);
  background: transparent;
  font-size: 13px;
}

.poi-search-form input::placeholder {
  color: var(--screen-muted);
}

.poi-search-form kbd {
  padding: 3px 6px;
  border: 1px solid var(--screen-border);
  border-radius: 6px;
  color: var(--screen-muted);
  background: var(--roadbook-panel-muted);
  font-size: 9px;
}

.poi-search-form .poi-search-exit {
  height: 29px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  color: var(--roadbook-text-secondary);
  cursor: pointer;
  background: var(--roadbook-panel-muted);
  font-size: 11px;
}

.poi-search-message {
  display: flex;
  min-height: 22px;
  padding: 5px 8px 0 35px;
  border-top: 1px solid var(--screen-border);
  align-items: center;
  color: var(--screen-muted);
  font-size: 11px;
}

.poi-search-panel--error .poi-search-message {
  color: var(--roadbook-danger);
}

.poi-search-panel--error .el-icon {
  color: var(--roadbook-danger);
}

.poi-search-panel--empty .el-icon {
  color: var(--roadbook-warning);
}

/* 地图点位详情浮层：点击路线点 marker 弹出，展示点位信息并提供移动/删除操作 */
.map-point-detail {
  position: absolute;
  z-index: 6;
  top: 116px;
  right: 20px;
  width: min(300px, calc(100% - 300px));
  min-width: 244px;
  padding: 14px 16px;
  border-radius: 13px;
}

.map-point-detail header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.map-point-detail header span {
  color: var(--screen-primary);
  font-size: 10px;
  letter-spacing: 1px;
}

.map-point-detail h3 {
  margin: 4px 0 0;
  color: #182033;
  font-size: 15px;
  line-height: 1.4;
}

.map-point-detail header > button {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 7px;
  color: #68748a;
  background: #f0f3f8;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.map-point-detail header > button:hover {
  color: #e5484d;
  background: #fdeeef;
}

.map-point-detail > p {
  margin: 8px 0 6px;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.map-point-detail-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.map-point-detail-tags span {
  padding: 2px 8px;
  border-radius: 999px;
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 8%, #ffffff);
  font-size: 11px;
}

.map-point-detail footer {
  display: flex;
  gap: 6px;
}

.map-point-detail footer button {
  flex: 1;
  padding: 6px 0;
  border: 1px solid #dfe3ea;
  border-radius: 7px;
  color: #3c4a5d;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}

.map-point-detail footer button:hover:not(:disabled) {
  border-color: var(--screen-primary);
  color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 5%, #ffffff);
}

.map-point-detail footer button.danger {
  border-color: #f6d4d4;
  color: #e5484d;
}

.map-point-detail footer button.danger:hover:not(:disabled) {
  border-color: #e5484d;
  background: #fdeeef;
}

.map-point-detail footer button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.poi-result-card {
  position: absolute;
  z-index: 13;
  top: 94px;
  left: 50%;
  width: min(420px, calc(100% - 900px));
  min-width: 360px;
  padding: 16px;
  border-radius: 13px;
  transform: translateX(-50%);
}

.poi-result-card header,
.poi-result-card footer,
.poi-result-meta {
  display: flex;
  align-items: center;
}

.poi-result-card header {
  justify-content: space-between;
  gap: 12px;
}

.poi-result-card header span {
  color: var(--screen-primary);
  font-size: 10px;
  letter-spacing: 1px;
}

.poi-result-card h3 {
  margin: 5px 0 0;
  font-size: 16px;
}

.poi-result-card header > button {
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 7px;
  color: var(--roadbook-text-secondary);
  cursor: pointer;
  background: var(--roadbook-panel-muted);
  font-size: 18px;
}

.poi-result-card > p {
  margin: 12px 0 8px;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
  line-height: 1.5;
}

.poi-pick-wrap {
  display: grid;
  gap: 8px;
  margin: 10px 0 4px;
}

.poi-pick-search {
  display: flex;
  gap: 6px;
}

.poi-pick-search .el-input {
  flex: 1;
}

.poi-pick-search > button {
  flex-shrink: 0;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  color: #fff;
  background: var(--screen-primary);
  cursor: pointer;
  font-size: 12px;
}

.poi-pick-search > button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.poi-pick-list {
  display: grid;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.poi-pick-title {
  color: var(--screen-primary);
  font-size: 10px;
  letter-spacing: 1px;
}

.poi-pick-empty {
  margin: 0;
  color: var(--roadbook-text-secondary);
  font-size: 12px;
}

.poi-pick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: var(--roadbook-panel-muted);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s, background 0.2s;
}

.poi-pick-item:hover {
  border-color: var(--screen-primary);
}

.poi-pick-item.active {
  border-color: var(--screen-primary);
  background: color-mix(in srgb, var(--screen-primary) 12%, transparent);
}

.poi-pick-name {
  color: var(--roadbook-text-primary);
  font-size: 12px;
  line-height: 1.4;
}

.poi-pick-item small {
  flex-shrink: 0;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--roadbook-text-secondary);
  font-size: 10px;
}

.poi-result-meta {
  gap: 8px;
}

.poi-result-meta span {
  padding: 3px 7px;
  border-radius: 5px;
  color: var(--roadbook-text-secondary);
  background: var(--roadbook-panel-muted);
  font-size: 10px;
}

.poi-result-card footer {
  margin-top: 14px;
  gap: 10px;
}

.poi-result-card footer .el-select {
  flex: 1;
}

.poi-result-card footer > button {
  height: 32px;
  padding: 0 16px;
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  background: var(--screen-primary);
  font-size: 12px;
}

.poi-add-day {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: none;
  color: var(--screen-muted);
  font-size: 12px;
  white-space: nowrap;
}

.poi-add-day .el-input-number {
  width: 88px;
}

.departure-tip {
  margin: 0;
  color: var(--screen-muted);
  font-size: 12px;
  line-height: 1.6;
}

:global(.map-point-marker) {
  position: relative;
  display: block;
  width: 34px;
  height: 42px;
  padding: 0;
  border: 0;
  cursor: pointer;
  background: transparent;
  font: inherit;
}

:global(.map-point-marker__pin) {
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  width: 34px;
  height: 34px;
  border: 3px solid #fff;
  border-radius: 50%;
  place-items: center;
  color: #fff;
  background: var(--roadbook-primary, #5b7cfa);
  box-shadow: 0 5px 14px rgba(25, 50, 100, 0.28);
  font-size: 12px;
  font-weight: 700;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

:global(.map-point-marker__pin::after) {
  position: absolute;
  bottom: -7px;
  left: 50%;
  width: 0;
  height: 0;
  border-top: 10px solid var(--roadbook-primary, #5b7cfa);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: "";
  transform: translateX(-50%);
}

:global(.map-point-marker__label) {
  position: absolute;
  top: 2px;
  left: 42px;
  display: block;
  max-width: 180px;
  padding: 6px 9px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--roadbook-primary) 20%, var(--roadbook-border));
  border-radius: 8px;
  color: var(--roadbook-text-primary);
  background: color-mix(in srgb, var(--roadbook-panel-bg) 96%, transparent);
  box-shadow: 0 4px 12px rgba(25, 50, 100, 0.14);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(10px);
}

:global(.map-point-marker__pin b) {
  font-size: 12px;
  line-height: 1;
}

:global(.map-point-marker:hover .map-point-marker__pin),
:global(.map-point-marker.is-selected .map-point-marker__pin) {
  box-shadow: 0 7px 18px rgba(25, 50, 100, 0.36);
  transform: scale(1.08);
}

:global(.map-point-marker.is-selected .map-point-marker__label) {
  border-color: var(--roadbook-primary);
  color: var(--roadbook-primary);
}

:global(.map-point-marker--route .map-point-marker__label) {
  opacity: 0.78;
}

:global(.map-point-marker--route:hover .map-point-marker__label) {
  opacity: 1;
}

@media (max-width: 1360px) {
  .screen-header {
    grid-template-columns: 225px minmax(280px, 360px) 1fr;
  }

  .header-actions button {
    padding-inline: 9px;
  }
}

@media (max-height: 870px) {
  .route-panel,
  .recommend-panel {
    bottom: 20px;
  }

  .route-list li {
    min-height: 48px;
  }

  .recommend-list article {
    min-height: 125px;
  }

  .map-controls {
    bottom: 150px;
  }

  .locate-button {
    bottom: 96px;
  }
}
</style>
