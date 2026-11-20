<template>
  <!-- GrowUp (zadání 2027 E2, návrh e): jedna lišta akcí v detailu na telefonu místo spodní navigace
       a plovoucího tlačítka. 64 px + bezpečná zóna. Položky: { key, label, icon, onClick, primary, disabled }.
       Stránka nad ní potřebuje dole místo: třída gl-actionbar-space (64 px + bezpečná zóna + 16 px). -->
  <nav class="gl-actionbar" :aria-label="ariaLabel || __('Akce')">
    <button
      v-for="a in actions"
      :key="a.key || a.label"
      type="button"
      class="gl-actionbar-btn"
      :class="a.primary && 'is-primary'"
      :disabled="a.disabled"
      @click="a.onClick"
    >
      <GlIcon v-if="a.icon" :name="a.icon" :size="20" />
      <span class="truncate">{{ a.label }}</span>
    </button>
  </nav>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'

defineProps({
  actions: { type: Array, default: () => [] },
  ariaLabel: { type: String, default: '' },
})
</script>
<style scoped>
.gl-actionbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  gap: 8px;
  padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
  background: var(--mat-bar);
  backdrop-filter: var(--mat-blur);
  border-top: 1px solid var(--line);
}
.gl-actionbar-btn {
  display: inline-flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 48px;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-700);
  background: var(--accent-soft);
  transition: transform var(--t-press) var(--ease-out);
}
.gl-actionbar-btn:active { transform: scale(0.97); }
.gl-actionbar-btn.is-primary { flex: 1.4; color: #fff; background: var(--accent-600); }
.gl-actionbar-btn:disabled { opacity: 0.5; }
.gl-actionbar-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (prefers-reduced-motion: reduce) { .gl-actionbar-btn { transition: none; } }
</style>
<style>
.gl-actionbar-space { padding-bottom: calc(64px + env(safe-area-inset-bottom) + 16px); }
</style>
