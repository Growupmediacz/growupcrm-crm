<template>
  <!-- GrowUp (design 1. kolo DKanbanMenu): kontextové menu na kartě zakázky v Kanbanu (pravé tlačítko).
       Otevřít, Upravit, Posunout do ▸, Zavolat, Poslat e-mail, Duplikovat, Smazat. -->
  <Teleport to="body">
    <div v-if="menu" class="fixed inset-0 z-[95]" @click="close" @contextmenu.prevent="close">
      <div ref="box" class="gl-sheet absolute w-[260px] rounded-[18px] p-1.5 text-[14px]" :style="{ left: `${pos.x}px`, top: `${pos.y}px` }" role="menu" @click.stop>
        <button v-for="it in items" :key="it.key" class="gl-menu-item" :class="[it.danger && '!text-[#a82614]', it.sub && sub && 'bg-white/70']" role="menuitem" @click="it.sub ? (sub = !sub) : run(it)" @mouseenter="it.sub ? (sub = true) : (sub = false)">
          <GlIcon :name="it.icon" :size="16" class="shrink-0 opacity-70" />
          <span class="flex-1 truncate text-left">{{ it.label }}</span>
          <span v-if="it.hint" class="text-[12px] text-ink-gray-5">{{ it.hint }}</span>
          <GlIcon v-if="it.sub" name="right" :size="14" class="opacity-60" />
        </button>
        <hr class="my-1 border-[rgba(110,120,200,.16)]" />
        <button class="gl-menu-item" role="menuitem" @click="run({ key: 'duplicate' })"><GlIcon name="copy" :size="16" class="opacity-70" /><span class="flex-1 text-left">{{ __('Duplikovat') }}</span><span class="text-[12px] text-ink-gray-5">⌘D</span></button>
        <button class="gl-menu-item !text-[#a82614]" role="menuitem" @click="run({ key: 'delete' })"><GlIcon name="trash" :size="16" /><span class="flex-1 text-left">{{ __('Smazat') }}</span></button>

        <!-- podmenu Posunout do -->
        <div v-if="sub" class="gl-sheet absolute top-[88px] w-[210px] rounded-[16px] p-1.5" :class="flip ? 'right-full mr-1' : 'left-full ml-1'" role="menu" @mouseleave="sub = false">
          <button v-for="s in stages" :key="s.name" class="gl-menu-item" role="menuitem" @click="run({ key: 'move', status: s.name })">
            <span class="size-2.5 shrink-0 rounded-full" :style="{ background: COLORS[s.name] || '#9ca3af' }" />
            <span class="flex-1 text-left">{{ __(s.name) }}</span>
            <GlIcon v-if="s.name === menu.lead.status" name="check" :size="15" class="text-[#4F46E5]" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { statusesStore } from '@/stores/statuses'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({ menu: { type: Object, default: null } }) // { x, y, lead }
const emit = defineEmits(['close', 'action'])
const { leadStatuses } = statusesStore()
const stages = computed(() => leadStatuses.data || [])
const COLORS = { 'Nová': '#3b82f6', 'Kontaktováno': '#8b5cf6', 'Nabídka odeslána': '#e0a100', 'Jednání': '#f97316', 'Vyhráno': '#22b35e', 'Prohráno': '#9ca3af' }
const sub = ref(false)
const flip = ref(false)
const box = ref(null)
const pos = reactive({ x: 0, y: 0 })

const person = computed(() => props.menu?.lead?.lead_name || props.menu?.lead?.first_name || '')
const items = computed(() => [
  { key: 'open', icon: 'arrow', label: __('Otevřít'), hint: '↵' },
  { key: 'edit', icon: 'edit', label: __('Upravit'), hint: '⌘E' },
  { key: 'move', icon: 'kanban', label: __('Posunout do'), sub: true },
  { key: 'call', icon: 'phone', label: person.value ? __('Zavolat {0}', [person.value]) : __('Zavolat') },
  { key: 'email', icon: 'mail', label: __('Poslat e-mail') },
])

// menu nesmí přetéct přes okraj okna
watch(() => props.menu, async (m) => {
  sub.value = false
  if (!m) return
  pos.x = m.x
  pos.y = m.y
  await nextTick()
  const r = box.value?.getBoundingClientRect()
  if (!r) return
  pos.x = Math.min(m.x, window.innerWidth - r.width - 16)
  pos.y = Math.min(m.y, window.innerHeight - r.height - 16)
  flip.value = pos.x + r.width + 220 > window.innerWidth
})
const close = () => emit('close')
function run(it) {
  emit('action', it, props.menu.lead)
  emit('close')
}
// klávesové zkratky v otevřeném menu
function onKey(e) {
  if (!props.menu) return
  if (e.key === 'Escape') return close()
  if (e.key === 'Enter') return run({ key: 'open' })
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') return e.preventDefault(), run({ key: 'edit' })
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd') return e.preventDefault(), run({ key: 'duplicate' })
  if (e.key === 'Delete' || e.key === 'Backspace') return run({ key: 'delete' })
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
