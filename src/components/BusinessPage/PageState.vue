<template>
  <div class="page-state" :class="stateClass" role="status">
    <div v-if="type === 'loading'" class="page-state__spinner" aria-hidden="true" />
    <div v-else class="page-state__icon" aria-hidden="true">{{ stateIcon }}</div>
    <h2>{{ resolvedTitle }}</h2>
    <p>{{ description }}</p>
    <el-button v-if="actionText" :type="type === 'error' ? 'primary' : undefined" @click="emit('action')">
      {{ actionText }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
type PageStateType = 'empty' | 'loading' | 'error'

const props = withDefaults(defineProps<{
  type?: PageStateType
  title?: string
  description: string
  actionText?: string
}>(), {
  type: 'empty',
  title: '',
  actionText: ''
})

const emit = defineEmits<{
  action: []
}>()

const stateClass = computed(() => `page-state--${props.type}`)
const stateIcon = computed(() => props.type === 'error' ? '!' : '·')
const resolvedTitle = computed(() => {
  if (props.title) {
    return props.title
  }
  const defaultTitles: Record<PageStateType, string> = {
    empty: '暂无数据',
    loading: '正在加载',
    error: '加载失败'
  }
  return defaultTitles[props.type as PageStateType]
})
</script>

<style scoped lang="scss">
.page-state {
  display: flex;
  min-height: 220px;
  padding: var(--roadbook-space-3);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.page-state h2 {
  margin: var(--roadbook-space-2) 0 var(--roadbook-space-1);
  color: var(--roadbook-text-primary);
  font-size: 17px;
  line-height: 1.4;
}

.page-state p {
  max-width: 520px;
  margin: 0 0 var(--roadbook-space-2);
  color: var(--roadbook-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.page-state__icon,
.page-state__spinner {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 50%;
}

.page-state__icon {
  color: var(--roadbook-primary);
  background: color-mix(in srgb, var(--roadbook-primary) 10%, transparent);
  font-size: 24px;
  font-weight: 700;
}

.page-state--error .page-state__icon {
  color: var(--roadbook-danger);
  background: color-mix(in srgb, var(--roadbook-danger) 10%, transparent);
}

.page-state__spinner {
  border: 3px solid color-mix(in srgb, var(--roadbook-primary) 18%, transparent);
  border-top-color: var(--roadbook-primary);
  animation: page-state-spin 0.8s linear infinite;
}

@keyframes page-state-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .page-state__spinner {
    animation-duration: 1.8s;
  }
}
</style>
