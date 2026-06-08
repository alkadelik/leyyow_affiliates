<template>
  <Teleport to="body">
    <div class="toast-stack">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="toast"
          :class="`toast--${t.type}`"
          @click="toast.dismiss(t.id)"
        >
          <i :class="iconClass(t.type)" aria-hidden="true" />
          <span>{{ t.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()
function iconClass(type) {
  return { success: 'ti ti-circle-check', error: 'ti ti-alert-circle', warning: 'ti ti-alert-triangle', info: 'ti ti-info-circle' }[type] ?? 'ti ti-info-circle'
}
</script>

<style scoped>
.toast-stack {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 9999; display: flex; flex-direction: column;
  gap: 8px; width: calc(100% - 32px); max-width: 400px;
  pointer-events: none;
}
.toast {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; border-radius: var(--radius-lg);
  font-size: 13px; font-weight: 500;
  pointer-events: all; cursor: pointer;
  box-shadow: var(--shadow-md);
}
.toast i { font-size: 16px; flex-shrink: 0; }
.toast--success { background: var(--green-bg);  color: var(--green-text); }
.toast--error   { background: var(--red-bg);    color: var(--red-text);   }
.toast--warning { background: var(--amber-bg);  color: var(--amber-text); }
.toast--info    { background: var(--blue-bg);   color: var(--blue-text);  }
.toast-enter-active { transition: all 0.2s ease; }
.toast-leave-active { transition: all 0.15s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(-8px); }
.toast-leave-to     { opacity: 0; transform: translateY(-4px); }
</style>
