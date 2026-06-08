<template>
  <div class="empty">
    <div class="empty__icon">
      <i :class="`ti ti-${icon}`" aria-hidden="true" />
    </div>
    <div class="empty__title">{{ title }}</div>
    <div v-if="message" class="empty__message">{{ message }}</div>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon:    { type: String, default: 'inbox' },
  title:   { type: String, required: true },
  message: { type: String, default: '' },
})
</script>

<style scoped>
.empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 56px 24px; text-align: center; gap: 8px; }
.empty__icon { width: 56px; height: 56px; background: var(--gray-bg); border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; margin-bottom: 8px; }
.empty__icon i { font-size: 26px; color: var(--text-tertiary); }
.empty__title   { font-size: 16px; font-weight: 600; }
.empty__message { font-size: 13px; color: var(--text-secondary); max-width: 280px; line-height: 1.6; }
</style>
