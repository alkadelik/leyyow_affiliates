<template>
  <div class="shell">
    <!-- Page content — scrollable, padded above bottom nav -->
    <main class="main">
      <RouterView v-slot="{ Component }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="$route.name" />
        </Transition>
      </RouterView>
    </main>

    <!-- Bottom tab navigation -->
    <nav class="bottom-nav" role="navigation" aria-label="Main navigation">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        class="tab"
        :class="{ active: isActive(tab) }"
        :aria-label="tab.label"
      >
        <i :class="`ti ti-${tab.icon}`" aria-hidden="true" />
        <span>{{ tab.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { to: '/dashboard', icon: 'layout-dashboard', label: 'Home'      },
  { to: '/campaigns', icon: 'speakerphone',      label: 'Campaigns' },
  { to: '/merchants', icon: 'building-store',    label: 'Merchants' },
  { to: '/payouts',   icon: 'cash',              label: 'Payouts'   },
  { to: '/profile',   icon: 'user',              label: 'Profile'   },
]

function isActive(tab) {
  return route.path === tab.to || route.path.startsWith(tab.to + '/')
}
</script>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background: var(--bg);
  position: relative;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding-bottom: calc(var(--bottom-nav-h) + 16px);
}

/* Bottom nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: var(--bottom-nav-h);
  background: var(--surface);
  border-top: 1px solid var(--border);
  display: flex;
  align-items: stretch;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  color: var(--text-tertiary);
  transition: color 0.15s;
  padding: 8px 4px;
  -webkit-tap-highlight-color: transparent;
}
.tab i    { font-size: 22px; line-height: 1; }
.tab span { font-size: 10px; font-weight: 500; letter-spacing: 0.02em; }
.tab.active       { color: var(--brand-deep); }
.tab.active i     { color: var(--brand); }
.tab.active span  { font-weight: 600; }
</style>
