<template>
  <!-- GrowUp (zadání 2027 E3): přehled klávesových zkratek (otevírá „?“) -->
  <Teleport to="body">
    <Transition name="gl-palette">
      <div
        v-if="open"
        class="fixed inset-0 z-[60] flex items-start justify-center bg-[var(--scrim)] px-4 pt-[12vh] backdrop-blur-[6px]"
        @mousedown.self="emit('close')"
      >
        <div
          ref="box"
          class="gl-sheet w-full max-w-[460px] rounded-[28px] p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gl-shortcuts-title"
          @keydown.esc.stop.prevent="emit('close')"
          @keydown.tab.prevent="closeBtn?.focus()"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <h2 id="gl-shortcuts-title" class="text-[19px] font-bold text-ink-gray-9">{{ __('Klávesové zkratky') }}</h2>
            <button
              ref="closeBtn"
              class="gl-round flex size-10 items-center justify-center rounded-full"
              :aria-label="__('Zavřít')"
              @click="emit('close')"
            >
              <span class="lucide-x size-4" aria-hidden="true" />
            </button>
          </div>
          <dl class="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-[15px]">
            <template v-for="row in rows" :key="row.label">
              <dt class="flex min-h-[36px] items-center text-ink-gray-8">{{ row.label }}</dt>
              <dd class="flex items-center gap-1">
                <kbd
                  v-for="k in row.keys"
                  :key="k"
                  class="rounded-md bg-[var(--outline-gray-1)] px-2 py-0.5 text-[13px] font-semibold text-ink-gray-7"
                  >{{ k }}</kbd
                >
              </dd>
            </template>
          </dl>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup>
import { GL_SHORTCUTS } from '@/composables/glShortcuts'
import { computed, nextTick, ref, watch } from 'vue'

// samostatně mountovaná aplikace nemá globální __, bere se z okna
const __ = window.__

const props = defineProps({ open: { type: Boolean, default: false } })
const emit = defineEmits(['close'])

const box = ref(null)
const closeBtn = ref(null)
let opener = null

const rows = computed(() => [
  { label: __('Hledání a akce'), keys: ['⌘', 'K'] },
  ...GL_SHORTCUTS.map((s) => ({ label: __('Přejít na {0}', [__(s.label)]), keys: ['g', s.key] })),
  { label: __('Tento přehled'), keys: ['?'] },
  { label: __('Zavřít okno'), keys: ['Esc'] },
])

watch(
  () => props.open,
  (open) => {
    if (open) {
      opener = document.activeElement
      nextTick(() => closeBtn.value?.focus())
    } else if (opener) {
      opener.focus?.()
      opener = null
    }
  },
)
</script>
