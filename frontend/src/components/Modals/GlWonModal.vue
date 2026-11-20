<template>
  <!-- GrowUp: „Zakázka vyhrána“ (design). Rodič uloží stav, datum podpisu, hodnotu a poznámku. -->
  <Dialog v-model:open="show" :options="{ size: 'md' }">
    <template #body-title>
      <!-- design 3. kolo (25): vycentrovaná hlavička s pohárem, názvem a hodnotou zakázky -->
      <div class="relative flex w-full flex-col items-center pt-2 text-center">
        <div class="pointer-events-none absolute -top-10 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(34,179,94,.22),transparent)]" aria-hidden="true" />
        <span class="relative flex size-16 items-center justify-center rounded-[20px] bg-[var(--stage-vyhrano)] text-white shadow-[0_10px_24px_-10px_rgba(34,179,94,.8)]">
          <GlIcon name="star" :size="30" />
        </span>
        <h3 class="relative mt-3 text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ __('Zakázka vyhrána') }}</h3>
        <span class="relative mt-1 text-[14px] text-ink-gray-5">{{ subtitle }}</span>
        <span v-if="valueText" class="num relative mt-2 text-[30px] font-bold tracking-tight text-ink-gray-9">{{ valueText }} Kč</span>
      </div>
    </template>
    <template #default>
      <!-- vedoucí + agenturní moduly: výhra jedním krokem (growupcrm.lead_actions.win_lead) -->
      <div v-if="managerMode && defaults.loading && !defaults.data" class="py-2"><GlSkeleton :rows="3" /></div>
      <div v-else-if="managerMode && result" class="flex flex-col gap-3" role="status">
        <div class="text-[16px] font-semibold text-ink-gray-9">{{ __('Co se stalo') }}</div>
        <ul class="flex flex-col gap-2 text-[15px] text-ink-gray-9">
          <li v-for="(line, i) in summary" :key="i" class="flex items-start gap-2.5">
            <GlIcon name="check" :size="16" class="mt-1 shrink-0 text-[#15803d]" />
            <span class="min-w-0 break-words">{{ line }}</span>
          </li>
        </ul>
        <router-link
          v-if="result.invoice"
          :to="{ name: 'Invoices' }"
          class="gl-quick w-fit !h-11 md:!h-9"
          @click="show = false"
        >
          <GlIcon name="card" :size="15" />{{ __('Návrh faktury') }}
        </router-link>
        <div v-if="warning" class="rounded-[14px] bg-[rgba(224,161,0,.14)] px-3.5 py-2.5 text-[14px] text-[var(--warning)]">{{ warning }}</div>
      </div>
      <div v-else-if="managerMode" class="flex flex-col gap-4">
        <div v-if="d.already_won" class="rounded-[14px] bg-[rgba(224,161,0,.14)] px-3.5 py-2.5 text-[14px] text-[var(--warning)]">
          {{ __('Zakázka už je vyhraná. Opakované potvrzení nic nezdvojí.') }}
        </div>
        <div>
          <div class="mb-1.5 text-[14px] font-medium text-ink-gray-7">{{ __('Hladina ceny') }}</div>
          <div class="flex flex-wrap gap-2" role="radiogroup" :aria-label="__('Hladina ceny')">
            <button
              v-for="t in d.tiers || []"
              :key="t.tier"
              type="button"
              role="radio"
              :aria-checked="tier === t.tier"
              class="gl-chip flex h-11 items-center rounded-full px-4 text-[14px] font-medium tabular-nums md:h-9"
              :class="tier === t.tier && '!bg-[var(--text-1)] !text-white'"
              @click="pickTier(t)"
            >
              {{ t.tier }} · {{ money(t.price) }}
            </button>
          </div>
        </div>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormControl v-model="valueText" type="text" :label="__('Hodnota')" inputmode="numeric">
            <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
          </FormControl>
          <FormControl v-model="signedDate" type="date" :label="__('Datum podpisu')" :placeholder="__('Vyberte datum')" />
          <FormControl
            v-model="winSource"
            type="select"
            :label="__('Zdroj výhry')"
            :options="[{ label: '–', value: '' }, ...(d.win_sources || []).map((s) => ({ label: __(s), value: s }))]"
          />
          <FormControl v-model="webSlug" type="text" :label="__('Zkratka webu')" :disabled="d.has_web" />
        </div>
        <div class="flex flex-col gap-2 rounded-[16px] border border-[var(--field-border)] bg-white/70 p-3.5">
          <label class="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] font-medium text-ink-gray-9 md:min-h-9">
            <input v-model="withRetainer" type="checkbox" class="size-5 rounded" :disabled="d.has_retainer" />
            {{ __('Měsíční služba') }}
            <span v-if="d.has_retainer" class="text-[13px] font-normal text-ink-gray-5">{{ __('už je založená') }}</span>
          </label>
          <div v-if="withRetainer && !d.has_retainer" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormControl v-model="retainerText" type="text" :label="__('Částka měsíčně')" inputmode="numeric" :placeholder="__('Např. 2 500')">
              <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
            </FormControl>
            <FormControl v-model="retainerServices" type="text" :label="__('Co obsahuje')" />
          </div>
        </div>
        <label class="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink-gray-9 md:min-h-9">
          <input v-model="createTasks" type="checkbox" class="size-5 rounded" />
          {{ __('Založit úkoly (podklady k webu, nabídka měsíční služby)') }}
        </label>
        <div class="text-[13px] text-ink-gray-5">
          {{ __('Vznikne: zakázka Vyhráno, klient a spolupráce, web ve fázi „1 Objednáno“ a návrh faktury (vystavíte ho vy).') }}
        </div>
        <FormControl v-model="note" type="textarea" :rows="2" :label="__('Poznámka')" :placeholder="__('Např. podpis na schůzce, fakturace 50 % předem')" />
        <ErrorMessage :message="error" />
      </div>
      <div v-else class="flex flex-col gap-4">
        <div class="grid grid-cols-2 gap-3">
          <FormControl v-model="signedDate" type="date" :label="__('Datum podpisu')" :placeholder="__('Vyberte datum')" />
          <FormControl v-model="valueText" type="text" :label="__('Finální hodnota')">
            <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
          </FormControl>
        </div>
        <!-- agenturní moduly: „Co dál“ – projekt a retainer jako dvě karty -->
        <div v-if="agencyEnabled" class="flex flex-col gap-2">
          <div class="text-[15px] font-semibold text-ink-gray-9">{{ __('Co dál') }}</div>
          <div class="grid grid-cols-2 gap-3">
            <label
              class="relative flex cursor-pointer flex-col gap-2 rounded-[16px] border p-4 transition"
              :class="createProject ? 'border-[var(--accent-600)] bg-[var(--accent-soft)]' : 'border-[var(--field-border)] bg-white/70 hover:bg-white'"
            >
              <input v-model="createProject" type="checkbox" class="absolute right-3 top-3 size-4 rounded" />
              <GlIcon name="folder" :size="22" class="text-[var(--accent-600)]" />
              <span class="text-[15px] font-semibold text-ink-gray-9">{{ __('Založit projekt') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ projectHint }}</span>
              <div v-if="createProject" class="flex flex-wrap gap-1.5" @click.prevent>
                <button
                  v-for="t in templates.data || []"
                  :key="t.name"
                  type="button"
                  class="gl-chip flex h-8 items-center rounded-full px-3 text-[13px] font-medium"
                  :class="template === t.name && '!bg-[var(--text-1)] !text-white'"
                  @click="template = t.name"
                >
                  {{ __(t.name) }}
                </button>
              </div>
            </label>
            <label
              class="relative flex cursor-pointer flex-col gap-2 rounded-[16px] border p-4 transition"
              :class="createRetainer ? 'border-[var(--accent-600)] bg-[var(--accent-soft)]' : 'border-[var(--field-border)] bg-white/70 hover:bg-white'"
            >
              <input v-model="createRetainer" type="checkbox" class="absolute right-3 top-3 size-4 rounded" />
              <GlIcon name="refresh" :size="22" class="text-[var(--accent-600)]" />
              <span class="text-[15px] font-semibold text-ink-gray-9">{{ __('Založit retainer') }}</span>
              <span class="text-[12.5px] text-ink-gray-5">{{ __('Pravidelná měsíční platba') }}</span>
              <div v-if="createRetainer" @click.prevent>
                <FormControl v-model="retainerText" type="text" :placeholder="__('Např. 25 000')">
                  <template #suffix><span class="text-[13px] text-ink-gray-5">Kč</span></template>
                </FormControl>
              </div>
            </label>
          </div>
          <div v-if="lead.organization" class="flex items-center gap-2 rounded-[14px] bg-[rgba(34,179,94,.1)] px-3.5 py-2.5 text-[13px] text-[#15803d]">
            <span class="size-2 rounded-full bg-[var(--stage-vyhrano)]" />{{ __('Firma {0} se přesune mezi Klienty.', [lead.organization]) }}
          </div>
        </div>
        <FormControl v-model="note" type="textarea" :rows="3" :label="__('Poznámka')" :placeholder="__('Např. podpis na schůzce, fakturace 50 % předem')" />
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div v-if="managerMode && result" class="flex justify-end gap-2">
        <Button variant="solid" class="max-md:!h-11" :label="__('Hotovo')" @click="show = false" />
      </div>
      <div v-else class="flex justify-end gap-2">
        <Button class="max-md:!h-11" :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" class="max-md:!h-11" iconLeft="check" :label="__('Potvrdit výhru')" :loading="saving" :disabled="managerMode && !d.lead" @click="confirm" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import { usersStore } from '@/stores/users'
import { agencyEnabled } from '@/composables/agency'
import { Button, Dialog, ErrorMessage, FormControl, Switch, call, createResource } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({
  lead: { type: Object, required: true },
  // async (values) => void; chyba se ukáže v dialogu
  onConfirm: { type: Function, required: true },
})
const show = defineModel({ type: Boolean })

const today = new Date()
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const signedDate = ref(props.lead.signed_date || iso(today))
const valueText = ref(props.lead.order_value ? new Intl.NumberFormat('cs-CZ').format(props.lead.order_value) : '')
const note = ref('')
const saving = ref(false)
const error = ref('')

const createProject = ref(false)
const createRetainer = ref(false)
const template = ref('')
const retainerText = ref('')
const templates = createResource({
  url: 'growupcrm.projects.get_templates',
  auto: agencyEnabled.value,
  onSuccess(rows) {
    if (!template.value && rows.length) template.value = rows[0].name
  },
})
const projectHint = computed(() => {
  if (!createProject.value) return __('Projekt s úkoly ze šablony')
  const t = (templates.data || []).find((x) => x.name === template.value)
  return t ? `${props.lead.order_title || props.lead.lead_name || ''} · ${__('šablona')} ${__(t.name)}` : ''
})

const subtitle = computed(() =>
  [props.lead.order_title || props.lead.lead_name, props.lead.organization].filter(Boolean).join(' · '),
)

// --- vedoucí: výhra jedním krokem -------------------------------------------------------------------
const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(n || 0))} Kč`
const parseNum = (v) => Number(String(v ?? '').replace(/\s/g, '').replace(/[^\d,.-]/g, '').replace(',', '.'))
const isMgr = !!usersStore().isManager()
const defaults = createResource({
  url: 'growupcrm.lead_actions.win_defaults',
  params: { lead: props.lead.name },
  auto: isMgr && agencyEnabled.value,
  onSuccess(r) {
    tier.value = r.price_tier
    valueText.value = new Intl.NumberFormat('cs-CZ').format(r.order_value || 0)
    winSource.value = r.win_source || ''
    webSlug.value = r.web_slug || ''
  },
})
// při chybě načtení výchozích hodnot zůstane dosavadní dialog (ten stav, datum a hodnotu uloží i tak)
const managerMode = computed(() => isMgr && agencyEnabled.value && !defaults.error)
const d = computed(() => defaults.data || {})
const tier = ref('')
const winSource = ref('')
const webSlug = ref('')
const withRetainer = ref(false)
const retainerServices = ref('')
const createTasks = ref(true)
const result = ref(null)
const warning = ref('')

function pickTier(t) {
  tier.value = t.tier
  valueText.value = new Intl.NumberFormat('cs-CZ').format(t.price)
}

const summary = computed(() => {
  const r = result.value
  if (!r) return []
  const lines = [__('Zakázka je ve stavu Vyhráno ({0}).', [money(r.order_value)])]
  lines.push(r.client?.created === false ? __('Klient už byl založený, spolupráce zůstala.') : __('Klient a spolupráce jsou založení.'))
  if (r.web) lines.push(__('Web {0} je ve fázi {1}.', [r.web.web_slug || r.web.name || '', r.web.web_phase || '1 Objednáno']))
  if (r.tasks?.length) lines.push(__('Úkoly: {0}.', [r.tasks.length]))
  if (r.invoice) lines.push(__('Návrh faktury čeká na vystavení.'))
  return lines
})

async function confirmManager() {
  const value = parseNum(valueText.value)
  const retainer = withRetainer.value && !d.value.has_retainer ? parseNum(retainerText.value) || 0 : 0
  saving.value = true
  try {
    const out = await call('growupcrm.lead_actions.win_lead', {
      lead: props.lead.name,
      price_tier: tier.value || undefined,
      order_value: Number.isFinite(value) && value > 0 ? value : undefined,
      retainer_amount: retainer,
      retainer_services: retainer > 0 ? retainerServices.value.trim() || undefined : undefined,
      web_slug: webSlug.value.trim() || undefined,
      win_source: winSource.value || undefined,
      signed_date: signedDate.value || undefined,
      create_tasks: createTasks.value ? 1 : 0,
    })
    result.value = out
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
    saving.value = false
    return
  }
  // Rodič (mark_won) jen znovu potvrdí stav, datum, hodnotu a uloží poznámku. Projekt ze šablony a retainer
  // se neposílají: založila je win_lead, jinak by vznikly dvakrát.
  try {
    await props.onConfirm({
      signed_date: signedDate.value || null,
      order_value: result.value.order_value || props.lead.order_value || 0,
      note: note.value.trim(),
      project_template: null,
      retainer_amount: 0,
    })
  } catch (e) {
    warning.value = __('Výhra je uložená, ale zakázku se nepodařilo obnovit: {0}', [e.messages?.[0] || e.message || ''])
  } finally {
    saving.value = false
  }
}

async function confirm() {
  error.value = ''
  if (managerMode.value && defaults.data) return confirmManager()
  const value = Number(String(valueText.value).replace(/[^\d,.-]/g, '').replace(',', '.'))
  saving.value = true
  try {
    await props.onConfirm({
      signed_date: signedDate.value || null,
      order_value: Number.isFinite(value) && value > 0 ? value : props.lead.order_value || 0,
      note: note.value.trim(),
      project_template: agencyEnabled.value && createProject.value ? template.value : null,
      retainer_amount: agencyEnabled.value && createRetainer.value
        ? Number(String(retainerText.value).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0
        : 0,
    })
    show.value = false
  } catch (e) {
    error.value = e.messages?.join('\n') || e.message
  } finally {
    saving.value = false
  }
}
</script>
