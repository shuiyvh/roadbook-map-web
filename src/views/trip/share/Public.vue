<template>
  <div class="share-page">
    <header class="brand"><span class="brand-mark">路</span><span>摩旅与旅游智能路书</span></header>

    <main class="share-card">
      <div class="cover" :style="coverStyle" aria-hidden="true"></div>

      <div class="detail">
        <h1>{{ routebook?.title || '路书分享' }}</h1>
        <div class="tags">
          <el-tag v-if="routebook?.startName && routebook?.endName" effect="plain">{{ routebook.startName }} → {{ routebook.endName }}</el-tag>
          <el-tag v-if="totalDistanceText" effect="plain">{{ totalDistanceText }}</el-tag>
          <el-tag v-if="totalDurationText" effect="plain">{{ totalDurationText }}</el-tag>
        </div>
        <p class="desc">{{ routebook?.description || '这份路书暂无说明。' }}</p>
      </div>
    </main>

    <section class="status-area">
      <page-state v-if="loading" type="loading" description="正在读取分享路书" />
      <page-state v-else-if="loadError" type="error" :description="loadError" action-text="重新加载" @action="load(false)" />
    </section>

    <el-dialog v-model="passwordOpen" title="访问密码" width="360px" append-to-body :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false">
      <el-form @submit.prevent="confirmPassword">
        <el-form-item>
          <el-input v-model="passwordInput" type="password" show-password placeholder="请输入访问密码" autofocus @keyup.enter="confirmPassword" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelPassword">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="confirmPassword">确认访问</el-button>
      </template>
    </el-dialog>

    <div v-if="routebook" class="captured-summary" aria-hidden="true">
      分享 · {{ routebook.startName || '起点未知' }} — {{ routebook.endName || '终点未知' }}
    </div>
  </div>
</template>

<script setup lang="ts" name="SharePublicPage">
import PageState from '@/components/BusinessPage/PageState.vue'
import { viewShareByCode } from '@/api/trip/share'
import type { TripShareRoutebookVo } from '@/types/api/trip/share'

// 注：computed/ref/onMounted/watch/useRoute/useRouter 由 unplugin-auto-import 自动导入，与项目既有页面保持一致

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const loadError = ref('')
const routebook = ref<TripShareRoutebookVo>()
const passwordOpen = ref(false)
const passwordInput = ref('')

/** 当前分享码（路由参数变化时重新加载） */
const shareCode = computed(() => String(route.params.shareCode || ''))

/** 封面占位色块（避免依赖外链图片，纯 CSS 渐变） */
const coverStyle = computed(() => ({
  background: `linear-gradient(135deg, ${toneFrom(routebook.value?.routebookId)} 0%, #6b7aff 100%)`
}))

const totalDistanceText = computed(() => {
  const m = routebook.value?.totalDistanceM
  if (m == null || m <= 0) return ''
  return m >= 1000 ? `${(m / 1000).toFixed(1)} 公里` : `${m} 米`
})

const totalDurationText = computed(() => {
  const s = routebook.value?.totalDurationS
  if (s == null || s <= 0) return ''
  const minutes = Math.round(s / 60)
  if (minutes < 60) return `约 ${minutes} 分钟`
  return `约 ${(minutes / 60).toFixed(1)} 小时`
})

/** 根据路书ID生成稳定的封面主色相 */
function toneFrom(id?: number): string {
  const base = (id ?? 1) * 137.508
  return `hsl(${base % 360}, 70%, 55%)`
}

/** 加载分享路书；首次默认尝试无密码访问 */
async function load(allowPasswordPrompt = true): Promise<void> {
  if (!shareCode.value) {
    loadError.value = '分享链接缺少分享码。'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const response = await viewShareByCode(shareCode.value, passwordInput.value || undefined)
    routebook.value = response.data
    passwordOpen.value = false
  } catch (error: any) {
    routebook.value = undefined
    const message = String(error?.msg || error?.message || '分享路书读取失败，请核对链接后重试。')
    // 后端对密码错误统一返回「分享访问密码错误」，据此进入密码交互
    if (allowPasswordPrompt && message.includes('密码')) {
      passwordOpen.value = true
    } else {
      loadError.value = message
    }
  } finally {
    loading.value = false
  }
}

/** 确认访问密码后重新加载 */
async function confirmPassword(): Promise<void> {
  submitting.value = true
  await load(false)
  submitting.value = false
}

/** 取消密码输入：回到可重试状态 */
function cancelPassword(): void {
  passwordOpen.value = false
  passwordInput.value = ''
  if (!routebook.value) loadError.value = '已取消访问，请核对分享链接与密码。'
}

onMounted(() => load())
watch(shareCode, () => {
  passwordInput.value = ''
  load()
})
</script>

<style scoped lang="scss">
.share-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 16px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #f4f6ff 0%, #eef1ff 100%);
  color: var(--roadbook-text-primary, #303133);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 28px;
  font-size: 15px;
  color: #5a607f;
}
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: linear-gradient(135deg, #4f6bff, #7a5cff);
  color: #fff;
  font-weight: 600;
}

.share-card {
  width: min(480px, 100%);
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 20px 50px rgba(80, 90, 180, 0.16);
}
.cover {
  height: 180px;
}
.detail {
  padding: 22px 24px 26px;
}
.detail h1 {
  margin: 0 0 12px;
  font-size: 20px;
  line-height: 1.4;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}
.desc {
  margin: 0;
  color: var(--roadbook-text-secondary, #606266);
  font-size: 14px;
  line-height: 1.7;
}

.status-area {
  width: min(480px, 100%);
  margin-top: 18px;
}

.captured-summary {
  margin-top: 24px;
  font-size: 13px;
  color: #9aa0c3;
}
</style>