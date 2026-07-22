<template>
  <main class="business-page" :class="`business-page--${layout}`">
    <header class="business-page__header">
      <div class="business-page__heading">
        <slot name="eyebrow" />
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="business-page__actions">
        <slot name="actions" />
      </div>
    </header>
    <section v-if="$slots.summary" class="business-page__summary">
      <slot name="summary" />
    </section>
    <div :class="templateClass">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="business-page__footer">
      <slot name="footer" />
    </footer>
  </main>
</template>

<script setup lang="ts">
type BusinessPageLayout = 'list' | 'detail' | 'form'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  layout?: BusinessPageLayout
}>(), {
  description: '',
  layout: 'list'
})

const templateClass = computed(() => `business-${props.layout}-template`)
</script>

<style scoped lang="scss">
.business-page {
  min-height: 100%;
  padding: var(--roadbook-space-3);
  color: var(--roadbook-text-regular);
  background: var(--roadbook-page-bg);
}

.business-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--roadbook-space-3);
  margin-bottom: var(--roadbook-space-3);
}

.business-page__heading {
  min-width: 0;
}

.business-page__heading h1 {
  margin: 0;
  color: var(--roadbook-text-primary);
  font-size: clamp(20px, 2vw, 24px);
  line-height: 1.35;
  font-weight: 700;
}

.business-page__heading p {
  max-width: 760px;
  margin: var(--roadbook-space-1) 0 0;
  color: var(--roadbook-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.business-page__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--roadbook-space-1);
}

.business-page__summary {
  margin-bottom: var(--roadbook-space-2);
}

.business-page__footer {
  margin-top: var(--roadbook-space-2);
}

@media (max-width: 768px) {
  .business-page {
    padding: var(--roadbook-space-2);
  }

  .business-page__header {
    flex-direction: column;
    gap: var(--roadbook-space-2);
  }

  .business-page__actions {
    width: 100%;
  }
}
</style>
