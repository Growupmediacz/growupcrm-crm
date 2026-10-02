<template>
  <!-- GrowUp: globální hledání ⌘K (design Liquid Glass). Data: growupcrm.search.search -->
  <button
    class="gl-round flex size-10 items-center justify-center rounded-full"
    :aria-label="__('Hledat (⌘K)')"
    :title="__('Hledat (⌘K)')"
    @click="open"
  >
    <GlIcon name="search" :size="18" />
  </button>

  <Teleport to="body">
    <Transition name="gl-palette">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-start justify-center bg-[rgba(30,34,80,.18)] px-4 pt-[12vh] backdrop-blur-[6px]"
        @mousedown.self="close"
      >
        <div
          class="gl-sheet flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[28px]"
          role="dialog"
          aria-modal="true"
          :aria-label="__('Hledání')"
        >
          <div class="flex items-center gap-3 px-5 py-4">
            <GlIcon name="search" :size="20" class="text-ink-gray-5" />
            <input
              ref="input"
              v-model="q"
              class="gl-palette-input flex-1 text-[19px] text-ink-gray-9"
              :placeholder="__('Hledat firmu, IČO, osobu, zakázku…')"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="pick(flat[active], $event)"
              @keydown.esc.prevent="close"
            />
            <kbd class="rounded-md bg-[rgba(110,120,200,.12)] px-1.5 py-0.5 text-[11px] font-semibold text-ink-gray-5">esc</kbd>
          </div>
          <div class="mx-4 h-px bg-[rgba(110,120,200,.14)]" />

          <div class="overflow-y-auto px-2 py-2">
            <div v-if="q.trim().length >= 2 && !loading && !results.length" class="px-3 py-4 text-[14px] text-ink-gray-5">
              {{ __('Nic nenalezeno.') }}
            </div>
            <template v-for="g in groups" :key="g.label">
              <div class="px-3 pb-1 pt-2 text-[12px] font-bold text-ink-gray-5">{{ __(g.label) }}</div>
              <button
                v-for="item in g.items"
                :key="item.type + item.name"
                class="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left"
                :class="flat[active] === item ? 'bg-[rgba(79,70,229,.10)]' : 'hover:bg-white/60'"
                @mouseenter="active = flat.indexOf(item)"
                @click="pick(item, $event)"
              >
                <div class="flex size-9 shrink-0 items-center justify-center rounded-xl" :class="TONE[item.type]">
                  <GlIcon :name="ICON[item.type]" :size="17" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[15px] font-semibold text-ink-gray-9">{{ item.title }}</div>
                  <div v-if="item.sub" class="truncate text-[12.5px] text-ink-gray-5">{{ item.sub }}</div>
                </div>
                <span v-if="flat[active] === item" class="text-[12px] text-ink-gray-5">↵ {{ item.hint || __('otevřít') }}</span>
              </button>
            </template>
          </div>

          <div class="flex gap-4 border-t border-[rgba(110,120,200,.14)] px-5 py-2.5 text-[12px] text-ink-gray-5">
            <span>↑↓ {{ __('vybrat') }}</span>
            <span>↵ {{ __('otevřít') }}</span>
            <span>⌘↵ {{ __('v novém okně') }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import LeadModal from '@/components/Modals/GlNewLeadModal.vue'
import { statusesStore } from '@/stores/statuses'
import { call } from 'frappe-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { leadStatuses } = statusesStore()

const show = ref(false)
const q = ref('')
const input = ref(null)
const results = ref([])
const loading = ref(false)
const active = ref(0)
const showLeadModal = ref(false)
const leadDefaults = computed(() => ({ status: leadStatuses.data?.[0]?.name || 'Nová' }))

const ICON = { organization: 'building', contact: 'user', lead: 'brief', action: 'plus', calendar: 'cal' }
const TONE = {
  organization: 'bg-[rgba(110,120,200,.12)] text-[#4b5280]',
  contact: 'bg-[#e6ecff] text-[#2440a6]',
  lead: 'bg-[#efe7ff] text-[#6d3fd0]',
  action: 'bg-[#dcf5e6] text-[#0f6b32]',
  calendar: 'bg-[#e6ecff] text-[#1f48b8]',
}

const ACTIONS = [
  { type: 'action', name: 'new-lead', title: __('Nová zakázka'), sub: __('Vytvořit'), hint: __('vytvořit') },
  { type: 'calendar', name: 'calendar', title: __('Naplánovat schůzku'), sub: __('Kalendář'), hint: __('otevřít') },
]

const groups = computed(() => [...results.value, { label: 'Akce', items: ACTIONS }])
const flat = computed(() => groups.value.flatMap((g) => g.items))

let timer = null
let seq = 0
watch(q, (value) => {
  clearTimeout(timer)
  active.value = 0
  if (value.trim().length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(async () => {
    const mine = ++seq
    loading.value = true
    try {
      const data = await call('growupcrm.search.search', { q: value })
      if (mine === seq) results.value = data || []
    } finally {
      if (mine === seq) loading.value = false
    }
  }, 180)
})

function open() {
  show.value = true
  q.value = ''
  results.value = []
  active.value = 0
  nextTick(() => input.value?.focus())
}
function close() {
  show.value = false
}
function move(step) {
  const n = flat.value.length
  if (n) active.value = (active.value + step + n) % n
}

function routeFor(item) {
  if (item.type === 'organization') return { name: 'Organization', params: { organizationId: item.name } }
  if (item.type === 'contact') return { name: 'Contact', params: { contactId: item.name } }
  if (item.type === 'lead') return { name: 'Lead', params: { leadId: item.name } }
  if (item.type === 'calendar') return { name: 'Calendar' }
  return null
}

function pick(item, event) {
  if (!item) return
  if (item.name === 'new-lead') {
    close()
    showLeadModal.value = true
    return
  }
  const to = routeFor(item)
  if (!to) return
  if (event?.metaKey || event?.ctrlKey) {
    window.open(router.resolve(to).href, '_blank')
    return
  }
  close()
  router.push(to)
}

function onKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    show.value ? close() : open()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
<style>
/* :not(#_) zvedá specifičnost nad globální styl polí v theme.css */
input.gl-palette-input:not(#_),
input.gl-palette-input:not(#_):focus {
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  outline: none;
  padding: 0;
  height: auto !important;
}
.gl-palette-enter-active,
.gl-palette-leave-active {
  transition: opacity 0.18s ease;
}
.gl-palette-enter-active .gl-sheet {
  transition: transform 0.28s var(--spring, cubic-bezier(.2, .9, .3, 1.2));
}
.gl-palette-enter-from,
.gl-palette-leave-to {
  opacity: 0;
}
.gl-palette-enter-from .gl-sheet {
  transform: translateY(-8px) scale(0.98);
}
</style>
