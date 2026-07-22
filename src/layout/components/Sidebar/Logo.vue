<template>
  <div class="sidebar-logo-container" :class="{ 'collapse': collapse }">
    <transition name="sidebarLogoFade">
      <router-link v-if="collapse" key="collapse" class="sidebar-logo-link" to="/">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-peak brand-peak-back"></span>
          <span class="brand-peak brand-peak-front"></span>
        </span>
      </router-link>
      <router-link v-else key="expand" class="sidebar-logo-link" to="/">
        <span class="brand-mark" aria-hidden="true">
          <span class="brand-peak brand-peak-back"></span>
          <span class="brand-peak brand-peak-front"></span>
        </span>
        <span class="brand-copy">
          <strong>Roadbook</strong>
          <small>{{ title }}</small>
        </span>
      </router-link>
    </transition>
  </div>
</template>

<script setup lang="ts">
defineProps({
  collapse: {
    type: Boolean,
    required: true
  }
})

const title = import.meta.env.VITE_APP_TITLE
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  height: var(--roadbook-header-height);
  background: var(--sidebar-bg);
  overflow: hidden;
  border-bottom: 1px solid var(--sidebar-border);

  & .sidebar-logo-link {
    display: flex !important;
    height: 100%;
    width: 100%;
    padding: 0 20px;
    align-items: center;
    gap: 12px;
    text-align: left;

    &:hover {
      background: var(--menu-hover);
    }
  }

  &.collapse {
    .sidebar-logo-link {
      padding: 0;
      justify-content: center;
    }
  }
}

.brand-mark {
  position: relative;
  display: inline-block;
  width: 34px;
  height: 30px;
  flex: 0 0 34px;
}

.brand-peak {
  position: absolute;
  bottom: 4px;
  width: 25px;
  height: 22px;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.brand-peak-back {
  right: 0;
  background: linear-gradient(145deg, #bda7fa, #8aa6ff);
}

.brand-peak-front {
  left: 0;
  bottom: 2px;
  background: linear-gradient(145deg, #8aa6ff, #6b7bea);
}

.brand-copy {
  display: grid;
  min-width: 0;
  line-height: 1.1;
}

.brand-copy strong {
  color: var(--roadbook-text-primary);
  font-size: 15px;
  font-weight: 750;
  letter-spacing: 0.01em;
}

.brand-copy small {
  margin-top: 5px;
  color: var(--roadbook-text-secondary);
  font-size: 10px;
  white-space: nowrap;
}
</style>
