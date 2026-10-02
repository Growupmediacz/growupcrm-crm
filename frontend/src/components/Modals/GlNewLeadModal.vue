<template>
  <!-- GrowUp: kompaktní „Nová zakázka“ (design). Podrobný formulář = původní LeadModal CRM. -->
  <LeadModal v-if="full" v-model="show" :defaults="fullDefaults" />
  <Dialog v-else v-model:open="show" :title="__('Nová zakázka')" :options="{ size: 'lg' }">
    <template #default>
      <form class="flex flex-col gap-4" @submit.prevent="create">
        <FormControl
          ref="titleInput"
          v-model="form.order_title"
          :label="__('Název zakázky')"
          :placeholder="__('Např. Nový web')"
          type="text"
        />

        <div class="relative">
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Firma') }}</div>
          <div
            v-if="org"
            class="flex h-10 items-center gap-2 rounded-[var(--r-field,12px)] border border-white/90 bg-white/70 pl-3 pr-1.5"
          >
            <GlIcon name="building" :size="16" class="text-ink-gray-5" />
            <span class="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-gray-9">{{ org.label }}</span>
            <span v-if="org.ico" class="text-[12px] text-ink-gray-5">IČO {{ org.ico }}</span>
            <button v-if="!lockedOrg" type="button" class="gl-chip-x" :aria-label="__('Změnit firmu')" @click="clearOrg">
              <GlIcon name="x" :size="13" />
            </button>
          </div>
          <div v-else class="relative">
            <GlIcon name="search" :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-gray-5" />
            <input
              v-model="orgQuery"
              class="h-10 w-full pl-9 pr-16 text-[14px]"
              :placeholder="__('Název firmy nebo IČO')"
              @keydown.down.prevent="moveOrg(1)"
              @keydown.up.prevent="moveOrg(-1)"
              @keydown.enter.prevent="pickOrg(orgItems[orgActive])"
            />
            <span class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[rgba(110,120,200,.12)] px-1.5 py-0.5 text-[11px] font-bold text-ink-gray-5">ARES</span>
          </div>
          <div
            v-if="!org && orgItems.length"
            class="gl-sheet absolute left-0 right-0 top-full z-10 mt-1.5 flex flex-col gap-0.5 rounded-2xl p-1.5"
          >
            <button
              v-for="(item, i) in orgItems"
              :key="item.key"
              type="button"
              class="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left"
              :class="i === orgActive ? 'bg-[rgba(79,70,229,.10)]' : 'hover:bg-white/70'"
              @mouseenter="orgActive = i"
              @click="pickOrg(item)"
            >
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                :class="item.ares ? 'bg-[rgba(110,120,200,.12)] text-ink-gray-5' : 'bg-[#dde6ff] text-[#2440a6]'"
              >
                <GlIcon v-if="item.ares" name="refresh" :size="14" />
                <template v-else>{{ initials(item.label) }}</template>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[14px] font-semibold text-ink-gray-9">{{ item.label }}</span>
                <span class="block truncate text-[12px] text-ink-gray-5">{{ item.sub }}</span>
              </span>
              <span v-if="i === orgActive" class="text-[12px] text-ink-gray-5">↵</span>
            </button>
          </div>
          <div v-if="orgLoading" class="mt-1 text-[12px] text-ink-gray-5">{{ __('Načítám z ARES…') }}</div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="valueText" :label="__('Hodnota')" type="text" :placeholder="__('Např. 40 000')">
            <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
          </FormControl>
          <FormControl v-model="form.next_step" :label="__('Další krok')" type="date" :placeholder="__('Vyberte datum')" />
        </div>

        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Fáze') }}</div>
          <div class="gl-seg flex w-full">
            <button
              v-for="s in stages"
              :key="s.name"
              type="button"
              class="gl-seg-btn flex-1 justify-center !px-2"
              :class="form.status === s.name && 'gl-seg-on'"
              @click="form.status = s.name"
            >
              {{ shortStage(s.name) }}
            </button>
          </div>
        </div>

        <ErrorMessage :message="error" />
      </form>
    </template>
    <template #actions>
      <div class="flex items-center gap-2">
        <button type="button" class="text-[13px] font-semibold text-[#4f46e5] hover:underline" @click="openFull">
          {{ __('Podrobný formulář') }}
        </button>
        <div class="flex-1" />
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Vytvořit zakázku')" :loading="saving" @click="create" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import LeadModal from '@/components/Modals/LeadModal.vue'
import { sessionStore } from '@/stores/session'
import { statusesStore } from '@/stores/statuses'
import { Button, Dialog, ErrorMessage, FormControl, call, toast } from 'frappe-ui'
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ defaults: { type: Object, default: () => ({}) } })
const show = defineModel({ type: Boolean })

const router = useRouter()
const { user } = sessionStore()
const { leadStatuses } = statusesStore()

const full = ref(false)
const saving = ref(false)
const error = ref('')
const titleInput = ref(null)

const form = ref({
  order_title: props.defaults.order_title || '',
  status: props.defaults.status || '',
  next_step: '',
})
const valueText = ref(props.defaults.order_value ? String(props.defaults.order_value) : '')

// fáze: otevřené a probíhající; Vyhráno jen když přichází z Kanbanu jako výchozí
const stages = computed(() =>
  (leadStatuses.data || []).filter(
    (s) => s.type !== 'Lost' && (s.type !== 'Won' || s.name === props.defaults.status),
  ),
)
watch(
  stages,
  (list) => {
    if (!form.value.status && list.length) form.value.status = list[0].name
  },
  { immediate: true },
)

// „Nabídka odeslána“ → „Nabídka“, ať se segment vejde (design)
const shortStage = (name) => {
  const label = __(name)
  return label.length > 12 ? label.split(' ')[0] : label
}
const initials = (s) =>
  (s || '?')
    .replace(/[,.]|s\.r\.o|a\.s/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

// --- firma ---
const lockedOrg = !!props.defaults.organization_link
const org = ref(lockedOrg ? { name: props.defaults.organization_link, label: props.defaults.organization_link } : null)
const orgQuery = ref('')
const orgResults = ref({ crm: [], ares: [] })
const orgActive = ref(0)
const orgLoading = ref(false)

const orgItems = computed(() => [
  ...orgResults.value.crm.map((o) => ({
    key: 'c' + o.name,
    name: o.name,
    label: o.organization_name || o.name,
    ico: o.ico,
    sub: [o.ico && `IČO ${o.ico}`, __('v CRM'), o.city].filter(Boolean).join(' · '),
  })),
  ...orgResults.value.ares.map((a) => ({
    key: 'a' + a.ico,
    ares: true,
    ico: a.ico,
    label: a.organization_name,
    sub: [__('Načíst z ARES'), `IČO ${a.ico}`, a.city].filter(Boolean).join(' · '),
  })),
])

let timer = null
let seq = 0
watch(orgQuery, (q) => {
  clearTimeout(timer)
  orgActive.value = 0
  if (q.trim().length < 2) {
    orgResults.value = { crm: [], ares: [] }
    return
  }
  timer = setTimeout(async () => {
    const mine = ++seq
    const data = await call('growupcrm.ares.find_companies', { q })
    if (mine === seq) orgResults.value = data || { crm: [], ares: [] }
  }, 250)
})

function moveOrg(step) {
  const n = orgItems.value.length
  if (n) orgActive.value = (orgActive.value + step + n) % n
}

async function pickOrg(item) {
  if (!item) return
  if (!item.ares) {
    org.value = { name: item.name, label: item.label, ico: item.ico }
    return
  }
  orgLoading.value = true
  try {
    const res = await call('growupcrm.ares.import_organization', { ico: item.ico })
    org.value = { name: res.name, label: res.organization_name || res.name, ico: item.ico }
    if (res.created) toast.success(__('Firma {0} byla založena z ARES', [org.value.label]))
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    orgLoading.value = false
  }
}

function clearOrg() {
  org.value = null
  orgQuery.value = ''
}

onMounted(async () => {
  if (lockedOrg) {
    const o = await call('frappe.client.get_value', {
      doctype: 'CRM Organization',
      filters: { name: props.defaults.organization_link },
      fieldname: ['organization_name', 'ico'],
    })
    if (o) org.value = { ...org.value, label: o.organization_name || org.value.label, ico: o.ico }
  }
  nextTick(() => titleInput.value?.$el?.querySelector('input')?.focus())
})

const orderValue = computed(() => {
  const n = Number(String(valueText.value).replace(/[^\d,.-]/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
})

// --- uložení ---
async function create() {
  error.value = ''
  if (!form.value.order_title.trim() && !org.value) {
    error.value = __('Vyplňte název zakázky nebo firmu.')
    return
  }
  saving.value = true
  try {
    const doc = await call('frappe.client.insert', {
      doc: {
        doctype: 'CRM Lead',
        ...stripLayoutDefaults(props.defaults),
        order_title: form.value.order_title.trim(),
        organization_link: org.value?.name || undefined,
        order_value: orderValue.value || undefined,
        status: form.value.status,
        lead_owner: props.defaults.lead_owner || user,
      },
    })
    if (form.value.next_step) {
      await call('frappe.client.insert', {
        doc: {
          doctype: 'CRM Task',
          title: __('Ozvat se'),
          status: 'Todo',
          priority: 'Medium',
          due_date: `${form.value.next_step} 09:00:00`,
          assigned_to: user,
          reference_doctype: 'CRM Lead',
          reference_docname: doc.name,
        },
      })
    }
    show.value = false
    router.push({ name: 'Lead', params: { leadId: doc.name } })
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}

function stripLayoutDefaults(d) {
  const { order_title, order_value, status, organization_link, ...rest } = d || {}
  return rest
}

// přechod na podrobný formulář s tím, co už je vyplněné
const fullDefaults = computed(() => ({
  ...props.defaults,
  order_title: form.value.order_title,
  status: form.value.status,
  organization_link: org.value?.name,
  order_value: orderValue.value || undefined,
}))
function openFull() {
  full.value = true
}
</script>
