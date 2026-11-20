<template>
  <!-- GrowUp (zadání 2027 E3): Faktury jen pro vedoucího. Data: growupcrm.invoices.list_invoices; vystavuje člověk (confirm). -->
  <LayoutHeader>
    <template #left-header>
      <span class="gl-page-title text-lg-medium text-ink-gray-9">{{ __('Faktury') }}</span>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="!allowed" :message="__('Faktury vidí jen vedoucí obchodu.')" />
  <div v-else class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <!-- záložky podle stavů -->
    <div class="flex flex-wrap items-center gap-2" role="tablist" :aria-label="__('Stav faktury')">
      <button
        v-for="t in tabs"
        :key="t.value"
        type="button"
        role="tab"
        :aria-selected="status === t.value"
        class="gl-chip flex h-11 items-center gap-2 rounded-full px-4 text-[14px] font-medium md:h-9"
        :class="status === t.value && 'gl-chip-on'"
        @click="setStatus(t.value)"
      >
        {{ t.label }}
        <span class="text-[13px] tabular-nums opacity-75">{{ t.count }}</span>
      </button>
      <div class="ml-auto w-full sm:w-64">
        <FormControl v-model="query" type="text" :placeholder="__('Hledat číslo, firmu, popis')" @keyup.enter="reload" @blur="reload" />
      </div>
    </div>

    <GlErrorBanner v-if="error" :title="__('Faktury se nepodařilo načíst')" :text="error" @retry="reload" />
    <GlSkeleton v-else-if="loading && !rows.length" :rows="5" />
    <GlEmptyState
      v-else-if="!rows.length"
      icon="card"
      :title="query ? __('Nic neodpovídá hledání') : __('Zatím tu nejsou žádné faktury')"
      :text="query ? __('Zkuste jiný výraz nebo jiný stav.') : __('Návrh faktury vznikne při výhře zakázky nebo na začátku měsíce u měsíčních služeb. Vystavujete ho vy.')"
    />

    <template v-else>
      <!-- telefon: karty -->
      <div v-if="isPhone" class="flex flex-col gap-3">
        <div v-for="r in rows" :key="r.name" class="gl-card flex flex-col gap-2 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="break-words text-[16px] font-bold text-ink-gray-9">{{ r.organization_name }}</div>
              <div class="break-words text-[14px] text-ink-gray-7">{{ r.description || r.kind }}</div>
            </div>
            <div class="shrink-0 text-right">
              <div class="text-[17px] font-bold tabular-nums text-ink-gray-9">{{ money(r.amount) }}</div>
              <span class="inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold" :class="badge(r.status)">{{ stateLabel(r) }}</span>
            </div>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-ink-gray-5">
            <span v-if="r.number" class="tabular-nums">{{ __('č. {0}', [r.number]) }}</span>
            <span>{{ dateLabel(r) }}</span>
            <span v-if="r.due_date">{{ __('splatnost {0}', [shortDate(r.due_date)]) }}</span>
            <span v-if="r.days_overdue" class="font-semibold text-[#c8321f]">{{ overdueText(r.days_overdue) }}</span>
          </div>
          <div class="flex flex-wrap gap-2 pt-1">
            <Button v-if="r.status === 'Návrh'" variant="solid" class="!h-11" :label="__('Vystavit')" @click="openIssue(r)" />
            <Button v-if="canPay(r)" class="!h-11" :label="__('Zaplaceno')" @click="openPaid(r)" />
            <Button v-if="canCancel(r)" class="!h-11" :label="__('Storno')" @click="openCancel(r)" />
          </div>
        </div>
      </div>

      <!-- desktop: tabulka -->
      <div v-else class="gl-card overflow-x-auto p-2">
        <table class="w-full min-w-[860px] text-left text-[14.5px]">
          <thead class="text-[13px] font-semibold text-ink-gray-5">
            <tr>
              <th class="px-3 py-2">{{ __('Číslo') }}</th>
              <th class="px-3 py-2">{{ __('Firma') }}</th>
              <th class="px-3 py-2">{{ __('Popis') }}</th>
              <th class="px-3 py-2 text-right">{{ __('Částka') }}</th>
              <th class="px-3 py-2">{{ __('Vystaveno / plánováno') }}</th>
              <th class="px-3 py-2">{{ __('Splatnost') }}</th>
              <th class="px-3 py-2 text-right">{{ __('Po splatnosti') }}</th>
              <th class="px-3 py-2"><span class="sr-only">{{ __('Akce') }}</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in rows" :key="r.name" class="border-t border-[rgba(110,120,200,.12)] align-top">
              <td class="px-3 py-3 tabular-nums">
                <div class="font-semibold text-ink-gray-9">{{ r.number || '—' }}</div>
                <span class="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[13px] font-semibold" :class="badge(r.status)">{{ stateLabel(r) }}</span>
              </td>
              <td class="px-3 py-3">
                <router-link :to="{ name: 'Organization', params: { organizationId: r.organization } }" class="font-semibold text-ink-gray-9 hover:text-[var(--accent-600)]">{{ r.organization_name }}</router-link>
              </td>
              <td class="px-3 py-3 text-ink-gray-7">
                <div class="break-words">{{ r.description || '—' }}</div>
                <div class="text-[13px] text-ink-gray-5">{{ r.kind }}</div>
              </td>
              <td class="px-3 py-3 text-right font-semibold tabular-nums text-ink-gray-9">{{ money(r.amount) }}</td>
              <td class="px-3 py-3 tabular-nums text-ink-gray-7">{{ dateLabel(r) }}</td>
              <td class="px-3 py-3 tabular-nums text-ink-gray-7">{{ r.due_date ? shortDate(r.due_date) : '—' }}</td>
              <td class="px-3 py-3 text-right tabular-nums" :class="r.days_overdue ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-5'">{{ r.days_overdue ? overdueText(r.days_overdue) : '—' }}</td>
              <td class="px-3 py-2">
                <div class="flex flex-wrap justify-end gap-2">
                  <Button v-if="r.status === 'Návrh'" variant="solid" :label="__('Vystavit')" @click="openIssue(r)" />
                  <Button v-if="canPay(r)" :label="__('Zaplaceno')" @click="openPaid(r)" />
                  <Button v-if="canCancel(r)" :label="__('Storno')" @click="openCancel(r)" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-center gap-3 text-[14px] text-ink-gray-5">
        <span class="tabular-nums">{{ __('Zobrazeno {0} z {1}', [rows.length, total]) }}</span>
        <Button v-if="rows.length < total" :loading="loading" class="max-md:!h-11" :label="__('Načíst další')" @click="loadMore" />
      </div>
    </template>
  </div>

  <!-- Vystavit -->
  <Dialog v-model:open="showIssue" :options="{ title: __('Vystavit fakturu'), size: 'md' }">
    <template #default>
      <div v-if="current" class="flex flex-col gap-4">
        <div class="rounded-[16px] bg-[rgba(110,120,200,.075)] px-4 py-3">
          <div class="text-[15px] font-semibold text-ink-gray-9">{{ current.organization_name }}</div>
          <div class="break-words text-[14px] text-ink-gray-7">{{ current.description || current.kind }}</div>
          <div class="mt-1 text-[22px] font-medium tabular-nums text-ink-gray-9">{{ money(current.amount) }}</div>
        </div>
        <label v-if="uol.send_enabled" class="flex min-h-11 cursor-pointer items-center gap-3 text-[15px] text-ink-gray-9 md:min-h-9">
          <input v-model="sendToUol" type="checkbox" class="size-5 rounded" />
          {{ __('Odeslat do UOL (číslo přidělí UOL)') }}
        </label>
        <FormControl
          v-if="!sendToUol"
          v-model="number"
          type="text"
          :label="__('Číslo faktury z UOL')"
          :placeholder="__('Např. 2027001')"
          required
        />
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FormControl v-model="issueDate" type="date" :label="__('Datum vystavení')" @update:modelValue="onIssueDate" />
          <FormControl v-model="dueDate" type="date" :label="__('Splatnost')" />
        </div>
        <ErrorMessage :message="dialogError" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button class="max-md:!h-11" :label="__('Zrušit')" @click="showIssue = false" />
        <Button variant="solid" class="max-md:!h-11" :label="__('Vystavit')" :loading="busy" :disabled="!sendToUol && !number.trim()" @click="submitIssue" />
      </div>
    </template>
  </Dialog>

  <!-- Zaplaceno -->
  <Dialog v-model:open="showPaid" :options="{ title: __('Faktura zaplacena'), size: 'sm' }">
    <template #default>
      <div v-if="current" class="flex flex-col gap-4">
        <div class="text-[15px] text-ink-gray-7">{{ current.organization_name }} · {{ current.number }} · <span class="tabular-nums">{{ money(current.amount) }}</span></div>
        <FormControl v-model="paidOn" type="date" :label="__('Zaplaceno dne')" />
        <ErrorMessage :message="dialogError" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button class="max-md:!h-11" :label="__('Zrušit')" @click="showPaid = false" />
        <Button variant="solid" class="max-md:!h-11" :label="__('Označit zaplaceno')" :loading="busy" @click="submitPaid" />
      </div>
    </template>
  </Dialog>

  <!-- Storno -->
  <Dialog v-model:open="showCancel" :options="{ title: __('Stornovat fakturu?'), size: 'sm' }">
    <template #default>
      <div v-if="current" class="flex flex-col gap-4">
        <div class="text-[15px] text-ink-gray-7">{{ current.organization_name }} · {{ current.number || __('návrh') }} · <span class="tabular-nums">{{ money(current.amount) }}</span></div>
        <div v-if="current.status !== 'Návrh'" class="rounded-[14px] bg-[rgba(224,161,0,.14)] px-3.5 py-2.5 text-[14px] text-[#7a4400]">
          {{ __('Faktura je vystavená. Storno se v UOL musí opravit dobropisem ručně.') }}
        </div>
        <FormControl v-model="reason" type="textarea" :rows="2" :label="__('Důvod storna')" required />
        <ErrorMessage :message="dialogError" />
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button class="max-md:!h-11" :label="__('Ne, ponechat')" @click="showCancel = false" />
        <Button variant="solid" theme="red" class="max-md:!h-11" :label="__('Stornovat')" :loading="busy" :disabled="!reason.trim()" @click="submitCancel" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isPhone } from '@/composables/glBreakpoint'
import { usersStore } from '@/stores/users'
import { Button, Dialog, ErrorMessage, FormControl, call, toast, usePageMeta } from 'frappe-ui'
import { computed, onMounted, ref } from 'vue'

usePageMeta(() => ({ title: __('Faktury') }))

// názvy stavů přesně podle growup_invoice.py
const STATES = ['Návrh', 'Vystaveno', 'Po splatnosti', 'Zaplaceno', 'Storno']
const PAGE = 50

const allowed = !!usersStore().isManager() // obchodník nic nevolá a nic nevidí
const status = ref('')
const query = ref('')
const rows = ref([])
const total = ref(0)
const counts = ref({})
const uol = ref({ configured: false, send_enabled: false })
const settings = ref({ due_days: 14 })
const loading = ref(false)
const error = ref('')

const tabs = computed(() => [
  { value: '', label: __('Vše'), count: Object.values(counts.value).reduce((a, b) => a + (b || 0), 0) },
  ...STATES.map((s) => ({ value: s, label: __(s), count: counts.value[s] || 0 })),
])

async function load(append = false) {
  loading.value = true
  error.value = ''
  try {
    const out = await call('growupcrm.invoices.list_invoices', {
      status: status.value || undefined,
      q: query.value.trim() || undefined,
      start: append ? rows.value.length : 0,
      limit: PAGE,
    })
    rows.value = append ? rows.value.concat(out.rows) : out.rows
    total.value = out.total
    counts.value = out.counts || {}
    uol.value = out.uol || uol.value
    settings.value = out.settings || settings.value
  } catch (e) {
    error.value = e.messages?.[0] || e.message || __('Neznámá chyba.')
  } finally {
    loading.value = false
  }
}
const reload = () => load(false)
const loadMore = () => load(true)
function setStatus(v) {
  status.value = v
  reload()
}
onMounted(() => {
  if (allowed) load()
})

// --- formát ---
const money = (n) => `${new Intl.NumberFormat('cs-CZ').format(Math.round((n || 0) * 100) / 100)} Kč`
const shortDate = (s) => (s ? new Date(`${String(s).slice(0, 10)}T00:00`).toLocaleDateString('cs-CZ') : '')
const dateLabel = (r) =>
  r.issue_date ? shortDate(r.issue_date) : r.planned_date ? __('plán {0}', [shortDate(r.planned_date)]) : '—'
const overdueText = (n) => (n === 1 ? __('1 den') : n <= 4 ? __('{0} dny', [n]) : __('{0} dní', [n]))
// stav je vždy i slovem, ne jen barvou
const stateLabel = (r) => (r.status === 'Po splatnosti' ? `! ${__(r.status)}` : r.status === 'Zaplaceno' ? `✓ ${__(r.status)}` : __(r.status))
const badge = (s) =>
  ({
    Návrh: 'bg-[rgba(110,120,200,.14)] text-[#3b4377]',
    Vystaveno: 'bg-[rgba(59,155,246,.14)] text-[#1d5fa8]',
    'Po splatnosti': 'bg-[rgba(200,50,31,.12)] text-[#a82614]',
    Zaplaceno: 'bg-[rgba(34,179,94,.14)] text-[#15803d]',
    Storno: 'bg-[rgba(110,120,200,.1)] text-[#5a6080] line-through',
  })[s] || ''
const canPay = (r) => r.status === 'Vystaveno' || r.status === 'Po splatnosti'
const canCancel = (r) => r.status !== 'Storno'

// --- dialogy ---
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const plusDays = (s, n) => {
  const d = new Date(`${s}T00:00`)
  d.setDate(d.getDate() + n)
  return iso(d)
}
const current = ref(null)
const busy = ref(false)
const dialogError = ref('')
const showIssue = ref(false)
const showPaid = ref(false)
const showCancel = ref(false)
const number = ref('')
const sendToUol = ref(false)
const issueDate = ref('')
const dueDate = ref('')
const paidOn = ref('')
const reason = ref('')

function open(r) {
  current.value = r
  dialogError.value = ''
  busy.value = false
}
function openIssue(r) {
  open(r)
  number.value = ''
  sendToUol.value = !!uol.value.send_enabled
  issueDate.value = iso(new Date())
  dueDate.value = plusDays(issueDate.value, Number(settings.value.due_days) || 14)
  showIssue.value = true
}
function onIssueDate(v) {
  if (v) dueDate.value = plusDays(String(v).slice(0, 10), Number(settings.value.due_days) || 14)
}
function openPaid(r) {
  open(r)
  paidOn.value = iso(new Date())
  showPaid.value = true
}
function openCancel(r) {
  open(r)
  reason.value = ''
  showCancel.value = true
}

async function run(url, args, dialog, okText) {
  busy.value = true
  dialogError.value = ''
  try {
    const out = await call(url, args)
    dialog.value = false
    toast.success(okText)
    if (out?.warning) toast.warning(out.warning)
    await reload()
  } catch (e) {
    dialogError.value = e.messages?.join('\n') || e.message
  } finally {
    busy.value = false
  }
}
const submitIssue = () =>
  run(
    'growupcrm.invoices.confirm',
    {
      name: current.value.name,
      number: sendToUol.value ? undefined : number.value.trim(),
      issue_date: issueDate.value || undefined,
      due_date: dueDate.value || undefined,
      ...(sendToUol.value ? { send_to_uol: 1 } : {}),
    },
    showIssue,
    __('Faktura je vystavená'),
  )
const submitPaid = () =>
  run('growupcrm.invoices.mark_paid', { name: current.value.name, paid_on: paidOn.value || undefined }, showPaid, __('Faktura je zaplacená'))
const submitCancel = () =>
  run('growupcrm.invoices.cancel', { name: current.value.name, reason: reason.value.trim() }, showCancel, __('Faktura je stornovaná'))
</script>
