<template>
  <div class="invite-page">
    <header class="brand"><span class="brand-mark">协</span><span>摩旅与旅游智能路书 · 协作邀请</span></header>

    <main class="invite-card">
      <div class="invite-icon" aria-hidden="true">🤝</div>
      <section class="status-area">
        <page-state v-if="loading" type="loading" description="正在读取邀请信息" />
        <page-state v-else-if="loadError" type="error" :description="loadError" />
        <template v-else-if="info">
          <h1>加入路书协作</h1>
          <p class="routebook-title">{{ info.routebookTitle || '未命名路书' }}</p>
          <el-tag class="role-tag" effect="plain">{{ roleLabel }}</el-tag>
          <p class="meta" v-if="info.maxUseCount && Number(info.maxUseCount) > 0">
            邀请人数 {{ info.usedCount ?? 0 }} / {{ info.maxUseCount }}
          </p>
          <p class="meta" v-else>不限人数</p>

          <div class="actions">
            <el-button v-if="!loggedIn" type="primary" size="large" :loading="redirecting" @click="goLogin">登录后接受邀请</el-button>
            <el-button v-else type="primary" size="large" :loading="accepting" @click="accept">接受邀请，加入协作</el-button>
            <el-button v-if="accepted" type="success" size="large" plain @click="goHome">回到工作台</el-button>
          </div>
          <p class="hint" v-if="accepted">已加入协作，现在可以查看并编辑该路书了。</p>
        </template>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts" name="InvitePublicPage">
import { ElMessage } from 'element-plus'
import PageState from '@/components/BusinessPage/PageState.vue'
import { acceptInviteByCode, viewInviteByCode } from '@/api/trip/invite'
import type { TripInviteInfoVo } from '@/types/api/trip/share'
import useUserStore from '@/store/modules/user'

// 注：computed/ref/onMounted/useRoute/useRouter/useDict 由 unplugin-auto-import 自动导入，与项目既有页面保持一致

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const accepting = ref(false)
const redirecting = ref(false)
const loadError = ref('')
const info = ref<TripInviteInfoVo>()
const accepted = ref(false)

const inviteCode = computed(() => String(route.params.inviteCode || ''))

/** 当前是否已登录（以 store 持有 token 为准） */
const loggedIn = computed(() => Boolean(userStore.token))

const { trip_routebook_role } = useDict('trip_routebook_role')

/** 协作角色中文名 */
const roleLabel = computed(() => {
  const found = trip_routebook_role.value.find((item: { value: string | number; label: string }) => String(item.value) === String(info.value?.roleCode))
  return found?.label || info.value?.roleCode || '成员'
})

/** 读取邀请公开信息 */
async function load(): Promise<void> {
  if (!inviteCode.value) {
    loadError.value = '邀请链接缺少邀请码。'
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const response = await viewInviteByCode(inviteCode.value)
    info.value = response.data
  } catch (error: any) {
    info.value = undefined
    loadError.value = String(error?.msg || error?.message || '邀请信息读取失败，请核对链接后重试。')
  } finally {
    loading.value = false
  }
}

/** 未登录：跳登录页，登录后回跳本页继续接受邀请 */
function goLogin(): void {
  redirecting.value = true
  router.push(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
}

/** 已登录：接受邀请写入成员 */
async function accept(): Promise<void> {
  accepting.value = true
  try {
    await acceptInviteByCode(inviteCode.value)
    accepted.value = true
    ElMessage.success('已接受邀请，加入路书协作')
  } catch (error: any) {
    ElMessage.error(String(error?.msg || error?.message || '接受邀请失败，请重试。'))
  } finally {
    accepting.value = false
  }
}

function goHome(): void {
  router.push('/')
}

onMounted(() => load())
</script>

<style scoped lang="scss">
.invite-page {
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

.invite-card {
  width: min(440px, 100%);
  border-radius: 18px;
  padding: 34px 30px 30px;
  background: #fff;
  box-shadow: 0 20px 50px rgba(80, 90, 180, 0.16);
  text-align: center;
}
.invite-icon {
  font-size: 40px;
  line-height: 1;
  margin-bottom: 16px;
}
.invite-card h1 {
  margin: 0 0 8px;
  font-size: 20px;
}
.routebook-title {
  margin: 0 0 12px;
  font-size: 15px;
  color: #4a4f6d;
  font-weight: 500;
}
.role-tag {
  margin-bottom: 10px;
}
.meta {
  margin: 8px 0 0;
  font-size: 13px;
  color: #9aa0c3;
}

.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #67c23a;
}

.status-area {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>