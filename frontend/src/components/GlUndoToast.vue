<template>
  <!-- GrowUp (zadání 2027 E1): toast „Vrátit zpět“ po odeslání e-mailu, s ubíhajícím proužkem -->
  <Teleport to="body">
    <Transition name="gl-undo">
      <div v-if="undoToast.visible" :key="undoToast.key" class="gl-undo" role="status" aria-live="polite">
        <span class="gl-undo-text">{{ undoToast.text }}</span>
        <button class="gl-undo-btn" :disabled="undoToast.busy" @click="undoToast.onUndo && undoToast.onUndo()">
          <GlIcon name="undo" :size="16" />{{ undoToast.busy ? __('Vracím…') : __('Vrátit zpět') }}
        </button>
        <span class="gl-undo-bar" :style="{ animationDuration: undoToast.seconds + 's' }" aria-hidden="true" />
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { undoToast } from '@/composables/glMail'
</script>
<style scoped>
.gl-undo {
  position: fixed;
  z-index: 120;
  left: 50%;
  /* nad plovoucí spodní lištou (GlTabBar) */
  bottom: calc(var(--gl-tabbar-h, 64px) + 40px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  width: min(520px, calc(100vw - 24px));
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 6px 6px 18px;
  border-radius: 16px;
  overflow: hidden;
  background: var(--text-1);
  color: #fff;
  font-size: 15px;
  box-shadow: var(--mat-sheet-shadow);
}
@media (max-width: 767px) {
  .gl-undo { bottom: calc(88px + env(safe-area-inset-bottom)); }
}
.gl-undo-text { flex: 1; min-width: 0; }
.gl-undo-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 16px;
  border-radius: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.gl-undo-btn:hover { background: rgba(255, 255, 255, 0.26); }
.gl-undo-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-undo-bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--accent-400);
  transform-origin: left;
  animation: gl-undo-run linear forwards;
}
@keyframes gl-undo-run { from { transform: scaleX(1); } to { transform: scaleX(0); } }
.gl-undo-enter-active { transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out); }
.gl-undo-leave-active { transition: opacity 150ms ease-in, transform 150ms ease-in; }
.gl-undo-enter-from, .gl-undo-leave-to { opacity: 0; transform: translate(-50%, 8px); }
@media (prefers-reduced-motion: reduce) {
  .gl-undo-enter-active, .gl-undo-leave-active { transition: none; }
  .gl-undo-bar { animation: none; }
}
</style>
