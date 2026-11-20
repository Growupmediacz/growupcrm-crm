<template>
  <!-- GrowUp: globální hledání ⌘K (design Liquid Glass). Data: growupcrm.search.search -->
  <button
    v-if="!hideTrigger"
    class="gl-round flex size-10 max-md:size-11 items-center justify-center rounded-full"
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
        class="fixed inset-0 z-50 flex items-start justify-center bg-[var(--scrim)] px-4 pt-[12vh] backdrop-blur-[6px] max-md:p-0"
        @mousedown.self="close"
      >
        <div
          class="gl-sheet flex max-h-[70vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[28px] max-md:h-full max-md:max-h-none max-md:max-w-none max-md:rounded-none"
          role="dialog"
          aria-modal="true"
          :aria-label="__('Hledání')"
        >
          <div class="flex h-[52px] items-center gap-3 px-5 box-content py-2">
            <GlIcon name="search" :size="20" class="text-ink-gray-5" />
            <input
              ref="input"
              v-model="q"
              class="gl-palette-input flex-1 text-[17px] text-ink-gray-9"
              :placeholder="__('Hledat firmu, IČO, osobu, zakázku…')"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="pick(flat[active], $event)"
              @keydown.esc.prevent="close"
            />
            <kbd class="rounded-md bg-[var(--outline-gray-1)] px-1.5 py-0.5 text-[13px] font-semibold text-ink-gray-5 max-md:hidden">esc</kbd>
            <button class="hidden size-11 shrink-0 items-center justify-center rounded-full text-ink-gray-6 max-md:flex" :aria-label="__('Zavřít')" @click="close">
              <GlIcon name="x" :size="20" />
            </button>
          </div>
          <!-- design 3. kolo (21): filtr typu výsledků -->
          <div class="flex flex-wrap gap-2 px-5 pb-3">
            <button
              v-for="f in FILTERS"
              :key="f.key"
              class="h-9 rounded-full px-3.5 text-[13px] font-semibold transition max-md:h-11"
              :class="kind === f.key ? 'bg-[var(--accent-600)] text-white' : 'bg-[color-mix(in_srgb,var(--c-tint)_10%,transparent)] text-ink-gray-7 hover:bg-[var(--line)]'"
              @click="(kind = f.key), (active = 0), input?.focus()"
            >
              {{ f.label }}
            </button>
          </div>
          <div class="mx-4 h-px bg-[var(--line)]" />

          <div class="min-h-0 flex-1 overflow-y-auto px-2 py-2">
            <GlErrorBanner v-if="error" :title="__('Hledání se nepovedlo')" :text="error" @retry="runSearch(q)" />
            <div v-else-if="loading && !results.length" class="px-3 py-3"><GlSkeleton :rows="3" /></div>
            <div v-else-if="q.trim().length >= 2 && !loading && !results.length && !flat.length" class="px-3 py-3">
              <GlEmptyState icon="search" :title="__('Nic jsme nenašli')" :text="__('Zkuste kratší výraz, jiné slovo nebo IČO firmy.')" />
            </div>
            <template v-for="g in groups" :key="g.label">
              <div class="px-3 pb-1 pt-3 text-[13px] font-semibold text-ink-gray-6">{{ __(g.label) }}</div>
              <button
                v-for="item in g.items"
                :key="item.type + item.name"
                class="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left max-md:min-h-[56px]"
                :class="flat[active] === item ? 'bg-[var(--accent-soft)]' : 'hover:bg-white/60'"
                @mouseenter="active = flat.indexOf(item)"
                @click="pick(item, $event)"
              >
                <div class="flex size-9 shrink-0 items-center justify-center rounded-full" :class="TONE[item.type]">
                  <GlIcon :name="item.icon || ICON[item.type]" :size="18" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="truncate text-[15px] font-semibold text-ink-gray-9"><template v-for="(part, i) in highlight(item.title)" :key="i"><mark v-if="part.hit" class="rounded-[4px] bg-[color-mix(in_srgb,var(--accent-600)_16%,transparent)] px-0.5 text-[var(--accent-700)]">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></div>
                  <div v-if="item.sub" class="truncate text-[14px] text-ink-gray-6">{{ item.sub }}</div>
                </div>
                <span v-if="flat[active] === item" class="shrink-0 text-[13px] text-ink-gray-6 max-md:hidden">↵ {{ item.hint || __('otevřít') }}</span>
                <kbd v-else-if="item.shortcut" class="shrink-0 rounded-md bg-[var(--outline-gray-1)] px-1.5 py-0.5 text-[13px] font-semibold text-ink-gray-5 max-md:hidden">{{ item.shortcut }}</kbd>
                <span v-else-if="TYPE_LABEL[item.type]" class="shrink-0 text-[13px] text-ink-gray-5 max-md:hidden">{{ TYPE_LABEL[item.type] }}</span>
              </button>
            </template>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--line)] px-5 py-2.5 text-[13px] text-ink-gray-6 max-md:hidden">
            <span>↑↓ {{ __('výběr') }}</span>
            <span>↵ {{ __('otevřít') }}</span>
            <span>⌘↵ {{ __('v novém okně') }}</span>
            <span>Esc {{ __('zavřít') }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import LeadModal from '@/components/Modals/GlNewLeadModal.vue'
import { statusesStore } from '@/stores/statuses'
import { usersStore } from '@/stores/users'
import { useGlNav } from '@/composables/glNav'
import { call } from 'frappe-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { glSearchRequest } from '@/composables/glSearch'

// hideTrigger: jen okno hledání bez tlačítka (otevírá se z levé lišty přes openGlSearch)
defineProps({ hideTrigger: { type: Boolean, default: false } })

const router = useRouter()
const { leadStatuses } = statusesStore()
const { pages: navPages } = useGlNav()

const show = ref(false)
const q = ref('')
const input = ref(null)
const results = ref([])
const loading = ref(false)
const error = ref('')
const active = ref(0)
const showLeadModal = ref(false)
const leadDefaults = computed(() => ({ status: leadStatuses.data?.[0]?.name || 'Nová' }))

const ICON = { organization: 'building', contact: 'user', lead: 'kanban', action: 'plus', calendar: 'calendar' }
const TYPE_LABEL = { organization: __('Firma'), contact: __('Kontakt'), lead: __('Zakázka'), action: __('Akce'), calendar: __('Kalendář') }
const TONE = {
  organization: 'bg-[var(--outline-gray-1)] text-[var(--c-indigo-600)]',
  contact: 'bg-[var(--c-blue-50-2)] text-[var(--c-blue-600)]',
  lead: 'bg-[var(--c-violet-50)] text-[var(--c-violet-450)]',
  action: 'bg-[var(--c-green-100)] text-[var(--success)]',
  calendar: 'bg-[var(--c-blue-50-2)] text-[var(--info)]',
}

// zadání 2027 E3: skupina „Akce“ (prázdný dotaz i shoda textu)
const NAV_SHORTCUT = { Today: 'g d', Leads: 'g z', Organizations: 'g f', ContactsCards: 'g k', Outreach: 'g o', Tasks: 'g u' }
const agentStatus = ref(null) // { enabled } jen pro vedoucí
const isManager = () => usersStore().isManager()

const allActions = computed(() => {
  const list = [
    { type: 'action', name: 'new-lead', title: __('Nová zakázka'), sub: __('Vytvořit'), hint: __('vytvořit'), icon: 'plus' },
    { type: 'calendar', name: 'calendar', title: __('Naplánovat schůzku'), sub: __('Kalendář'), hint: __('otevřít') },
    ...navPages.value.map((p) => ({
      type: 'action',
      name: 'go-' + p.key,
      title: __('Přejít na {0}', [__(p.label)]),
      keywords: __(p.label),
      icon: p.icon,
      to: { name: p.key },
      shortcut: NAV_SHORTCUT[p.key],
    })),
    { type: 'action', name: 'go-week', title: __('Týden ke schválení'), sub: __('Outreach'), icon: 'send', to: { name: 'WeekApprove' }, shortcut: 'g t' },
    { type: 'action', name: 'go-agent-log', title: __('Záznam agenta'), sub: __('Agent'), icon: 'sparkles', to: { name: 'AgentLog' } },
    { type: 'action', name: 'go-settings', title: __('Nastavení'), icon: 'sliders', to: { name: 'Settings' }, shortcut: 'g n' },
  ]
  if (agentStatus.value) {
    const on = agentStatus.value.enabled
    list.push({
      type: 'action',
      name: 'agent-toggle',
      title: on ? __('Vypnout agenta') : __('Zapnout agenta'),
      sub: __('Agent'),
      icon: 'sparkles',
      hint: on ? __('vypnout') : __('zapnout'),
    })
  }
  return list
})
const ACTIONS = computed(() => {
  const needle = fold(q.value.trim())
  if (!needle) return allActions.value
  return allActions.value.filter((a) => fold(`${a.title} ${a.keywords || ''} ${a.sub || ''}`).includes(needle))
})

const FILTERS = [
  { key: '', label: __('Vše') },
  { key: 'lead', label: __('Zakázky') },
  { key: 'organization', label: __('Firmy') },
  { key: 'contact', label: __('Kontakty') },
]
const kind = ref('')
const groups = computed(() => {
  const found = results.value
    .map((g) => ({ ...g, items: kind.value ? g.items.filter((i) => i.type === kind.value) : g.items }))
    .filter((g) => g.items.length)
  if (kind.value) return found
  return ACTIONS.value.length ? [...found, { label: 'Akce', items: ACTIONS.value }] : found
})
// zvýraznění hledaného výrazu v názvu (bez ohledu na velikost písmen a diakritiku)
// po znacích, ať indexy sedí na původní text (á → a, ne á → a + ´)
const fold = (t) => Array.from(String(t || ''), (c) => c.normalize('NFD')[0]).join('').toLowerCase()
function highlight(text) {
  const t = String(text || '')
  const needle = fold(q.value.trim())
  const at = needle.length >= 2 ? fold(t).indexOf(needle) : -1
  if (at < 0) return [{ text: t }]
  return [
    { text: t.slice(0, at) },
    { text: t.slice(at, at + needle.length), hit: true },
    { text: t.slice(at + needle.length) },
  ].filter((p) => p.text)
}
const flat = computed(() => groups.value.flatMap((g) => g.items))

let timer = null
let seq = 0
watch(q, (value) => {
  clearTimeout(timer)
  active.value = 0
  error.value = ''
  if (value.trim().length < 2) {
    results.value = []
    return
  }
  timer = setTimeout(() => runSearch(value), 180)
})
async function runSearch(value) {
  const mine = ++seq
  loading.value = true
  error.value = ''
  try {
    const data = await call('growupcrm.search.search', { q: value })
    if (mine === seq) results.value = data || []
  } catch (e) {
    if (mine === seq) error.value = e?.messages?.[0] || e?.message || __('Zkuste to prosím znovu.')
  } finally {
    if (mine === seq) loading.value = false
  }
}

watch(glSearchRequest, () => open())

function open() {
  show.value = true
  kind.value = ''
  q.value = ''
  results.value = []
  error.value = ''
  active.value = 0
  nextTick(() => input.value?.focus())
  loadAgentStatus()
}
async function loadAgentStatus() {
  agentStatus.value = null
  if (!isManager()) return
  try {
    agentStatus.value = await call('growupcrm.agent_tools.status')
  } catch (e) {
    agentStatus.value = null
  }
}
async function toggleAgent() {
  const next = agentStatus.value?.enabled ? 0 : 1
  const text = next ? __('Zapnout agenta? Začne znovu používat nástroje CRM.') : __('Vypnout agenta? Přestane používat nástroje CRM.')
  if (!window.confirm(text)) return
  try {
    const res = await call('growupcrm.agent_tools.set_enabled', { enabled: next })
    agentStatus.value = { ...agentStatus.value, enabled: res?.enabled ?? !!next }
  } catch (e) {
    window.alert(__('Přepnutí agenta se nepovedlo.'))
  }
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
  if (item.name === 'agent-toggle') {
    close()
    toggleAgent()
    return
  }
  const to = item.to || routeFor(item)
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
