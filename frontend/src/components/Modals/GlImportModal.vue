<template>
  <!-- GrowUp (design 2. kolo, C8): Import dat – Soubor → Mapování → Kontrola → Výsledek.
       Kontakty, Firmy i Zakázky (náhrada anglického Data Importu z frappe-ui), duplicity hlídá server. -->
  <Dialog v-model:open="show" :title="K.title" :options="{ size: '3xl' }">
    <template #default>
      <ol class="mb-5 flex flex-wrap items-center gap-2 text-[13px] font-semibold">
        <template v-for="(s, i) in STEPS" :key="s">
          <li class="flex items-center gap-2" :class="step === i ? 'text-ink-gray-9' : 'text-ink-gray-5'">
            <span class="flex size-7 items-center justify-center rounded-full text-[12px]" :class="step === i ? 'bg-[#4F46E5] text-white' : step > i ? 'bg-[rgba(34,179,94,.18)] text-[#0f6b32]' : 'bg-[rgba(110,120,200,.14)]'">{{ step > i ? '✓' : i + 1 }}</span>{{ s }}
          </li>
          <span v-if="i < STEPS.length - 1" class="hidden h-px w-8 bg-[rgba(110,120,200,.25)] sm:block" />
        </template>
      </ol>

      <!-- 1 Soubor -->
      <div v-if="step === 0" class="flex flex-col gap-3">
        <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(110,120,200,.35)] px-4 py-10 text-center hover:bg-white/50" @dragover.prevent @drop.prevent="onDrop">
          <GlIcon name="upload" :size="24" /><span class="text-[16px] font-semibold text-ink-gray-9">{{ fileName || __('Přetáhněte soubor Excel nebo CSV, nebo klikněte') }}</span>
          <span class="text-[13px] text-ink-gray-5">{{ __('Excel (.xlsx) nebo CSV, první řádek je záhlaví.') }} {{ K.required }}</span>
          <input type="file" accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="hidden" @change="(e) => read(e.target.files?.[0])" />
        </label>
        <p class="text-[13px] text-ink-gray-5">
          {{ __('Z Google Tabulek: Soubor → Stáhnout → Microsoft Excel.') }}
          <button class="font-semibold text-[#4F46E5] hover:underline" @click="downloadSample">{{ __('Stáhnout vzorový soubor') }}</button>
        </p>
        <label v-if="sheets.length > 1" class="flex items-center gap-3 text-[14px] text-ink-gray-7">
          <span>{{ __('List sešitu') }}</span>
          <select v-model="sheet" class="gl-field !h-10 !w-auto" @change="loadSheet">
            <option v-for="s in sheets" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
        <p v-if="loading" class="text-[14px] text-ink-gray-5">{{ __('Načítám soubor…') }}</p>
        <p v-else-if="rows.length" class="text-[14px] text-ink-gray-7">{{ __('Načteno {0} řádků.', [rows.length]) }}</p>
        <p v-else-if="fileName && header.length" class="text-[14px] font-semibold text-[#a82614]">{{ __('Ve vybraném listu je jen záhlaví, žádné řádky s daty.') }}</p>
      </div>

      <!-- 2 Mapování -->
      <div v-else-if="step === 1" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label v-for="f in FIELDS" :key="f.key"><span class="gl-label">{{ f.label }}</span>
          <select v-model="map[f.key]" class="gl-field w-full"><option value="">{{ __('— nepoužít —') }}</option><option v-for="(h, i) in header" :key="i" :value="String(i)">{{ h }}</option></select></label>
      </div>

      <!-- 3 Kontrola -->
      <div v-else-if="step === 2 && preview">
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3"><div class="num text-[30px] font-bold text-[#0f6b32]">{{ preview.counts['nový'] }}</div><div class="text-[13px] text-ink-gray-5">{{ K.newLabel }}</div></div>
          <div class="rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3"><div class="num text-[30px] font-bold text-[#7a4400]">{{ preview.counts['sloučit'] }}</div><div class="text-[13px] text-ink-gray-5">{{ K.mergeLabel }}</div></div>
          <div class="rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3"><div class="num text-[30px] font-bold text-[#a82614]">{{ preview.counts['chyba'] }}</div><div class="text-[13px] text-ink-gray-5">{{ __('chyba – přeskočíme') }}</div></div>
        </div>
        <div class="mt-3 max-h-[240px] overflow-y-auto rounded-2xl bg-[rgba(110,120,200,.06)] p-2">
          <div class="hidden grid-cols-[60px_1.4fr_90px_1.4fr] gap-3 px-2 pb-1 text-[12px] font-semibold text-ink-gray-5 sm:grid"><span>{{ __('Řádek') }}</span><span>{{ K.itemLabel }}</span><span>{{ __('Výsledek') }}</span><span>{{ __('Poznámka') }}</span></div>
          <div v-for="i in preview.items" :key="i.row" class="grid grid-cols-[50px_1fr_auto] items-center gap-x-3 rounded-xl px-2 py-1.5 sm:grid-cols-[60px_1.4fr_90px_1.4fr]">
            <span class="num text-[13px] text-ink-gray-5">{{ i.row }}</span>
            <span class="min-w-0"><span class="block truncate text-[14px] font-bold text-ink-gray-9">{{ i.name || __('(bez názvu)') }}</span><span class="block truncate text-[12px] text-ink-gray-5">{{ i.company || i.email || '' }}</span></span>
            <span class="text-[13px] font-bold" :class="{ 'text-[#0f6b32]': i.status === 'nový', 'text-[#7a4400]': i.status === 'sloučit', 'text-[#a82614]': i.status === 'chyba' }">{{ K.status[i.status] }}</span>
            <span class="col-span-3 truncate text-[13px] text-ink-gray-7 sm:col-span-1">{{ i.note }}</span>
          </div>
        </div>
        <label v-if="kind === 'contact' && outreachEnabled && campaigns.data?.length" class="mt-3 flex items-center justify-between gap-3 rounded-2xl px-1 py-2">
          <span><span class="block text-[15px] font-semibold text-ink-gray-9">{{ __('Přidat nové kontakty do kampaně') }}</span>
            <select v-if="toCampaign" v-model="campaign" class="gl-field mt-1.5 !h-10 !w-auto"><option v-for="c in campaigns.data" :key="c.name" :value="c.name">{{ c.campaign_name }}</option></select>
            <span v-else class="block text-[13px] text-ink-gray-5">{{ __('Outreach') }}</span></span>
          <Switch v-model="toCampaign" />
        </label>
      </div>

      <!-- 4 Výsledek -->
      <div v-else-if="step === 3 && result" class="flex flex-col items-center gap-2 py-6 text-center">
        <span class="flex size-14 items-center justify-center rounded-full bg-[rgba(34,179,94,.16)] text-[#0f6b32]"><GlIcon name="check" :size="26" /></span>
        <div class="text-[22px] font-bold text-ink-gray-9">{{ __('Import dokončen') }}</div>
        <p class="text-[14px] text-ink-gray-7">{{ K.result(result) }}</p>
        <div v-if="result.errors?.length" class="mt-2 max-h-[140px] w-full overflow-y-auto rounded-2xl bg-[rgba(229,72,77,.08)] p-3 text-left text-[13px] text-[#a82614]">
          <div v-for="e in result.errors" :key="e.row">{{ __('Řádek {0}: {1}', [e.row, e.error]) }}</div>
        </div>
        <p v-if="result.campaign" class="text-[13px] text-ink-gray-5">{{ __('Do kampaně přidáno {0}.', [result.campaign.added]) }}</p>
      </div>
      <ErrorMessage class="mt-2" :message="error" />
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <span class="hidden text-[13px] text-ink-gray-5 sm:block">{{ fileName }}<template v-if="rows.length"> · {{ __('{0} řádků', [rows.length]) }}</template></span>
        <div class="ml-auto flex gap-2">
          <Button v-if="step > 0 && step < 3" :label="__('Zpět')" @click="step--" />
          <Button v-if="step < 3" :label="__('Zrušit')" @click="show = false" />
          <Button v-if="step < 2" variant="solid" :disabled="!canNext" :label="__('Pokračovat')" :loading="busy" @click="next" />
          <Button v-else-if="step === 2" variant="solid" iconLeft="upload" :loading="busy" :label="__('Importovat {0} řádků', [rows.length])" @click="run" />
          <Button v-else variant="solid" :label="__('Hotovo')" @click="done" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { outreachEnabled } from '@/composables/agency'
import { guessColumn, parseCsv } from '@/utils/csv'
import { Button, Dialog, ErrorMessage, Switch, call, createResource } from 'frappe-ui'
import { computed, reactive, ref } from 'vue'

const props = defineProps({ kind: { type: String, default: 'contact' } })
const emit = defineEmits(['done'])
const show = defineModel({ type: Boolean })
const STEPS = [__('Soubor'), __('Mapování'), __('Kontrola'), __('Výsledek')]
const STATUS = { 'nový': __('nový'), 'sloučit': __('sloučit'), 'chyba': __('chyba') }
const KINDS = {
  contact: {
    title: __('Import kontaktů'),
    required: __('Jméno nebo příjmení je povinné.'),
    fields: [
      { key: 'first_name', label: __('Jméno'), re: /jm[eé]no|first|křestní/ }, { key: 'last_name', label: __('Příjmení'), re: /p[rř][ií]jmen|last|surname/ },
      { key: 'email', label: __('E-mail'), re: /mail/ }, { key: 'phone', label: __('Telefon'), re: /tel|mobil|phone/ },
      { key: 'company', label: __('Firma'), re: /firma|company|spole[cč]nost|organizace/ }, { key: 'designation', label: __('Pozice'), re: /pozice|funkce|title|position/ },
    ],
    ready: (m) => m.first_name !== '' || m.last_name !== '',
    preview: 'growupcrm.contacts.import_preview',
    commit: 'growupcrm.contacts.import_commit',
    newLabel: __('nových kontaktů'), mergeLabel: __('sloučíme s existujícími'), itemLabel: __('Kontakt'), status: STATUS,
    result: (r) => __('Nových kontaktů: {0} · sloučených: {1} · přeskočených: {2}', [r.created, r.merged, r.failed]),
  },
  organization: {
    title: __('Import firem'),
    required: __('Název firmy je povinný.'),
    fields: [
      { key: 'organization_name', label: __('Název firmy'), re: /n[aá]zev|firma|company|spole[cč]nost|organizace/ }, { key: 'ico', label: __('IČO'), re: /i[cč]o/ },
      { key: 'website', label: __('Web'), re: /web|www|dom[eé]na|url|site/ }, { key: 'industry', label: __('Obor'), re: /obor|industry|segment/ },
      { key: 'street', label: __('Ulice'), re: /ulice|street|adresa/ }, { key: 'city', label: __('Město'), re: /m[eě]sto|city|obec/ },
      { key: 'zip_code', label: __('PSČ'), re: /ps[cč]|zip|postal/ },
    ],
    ready: (m) => m.organization_name !== '',
    preview: 'growupcrm.data_import.preview',
    commit: 'growupcrm.data_import.commit',
    newLabel: __('nových firem'), mergeLabel: __('už v CRM – doplníme prázdná pole'), itemLabel: __('Firma'),
    status: { ...STATUS, 'sloučit': __('doplnit') },
    result: (r) => __('Nových firem: {0} · doplněných: {1} · přeskočených: {2}', [r.created, r.merged, r.failed]),
  },
  lead: {
    title: __('Import zakázek'),
    required: __('Vyplňte firmu (nebo IČO) či jméno osoby.'),
    fields: [
      { key: 'order_title', label: __('Název zakázky'), re: /zak[aá]zk|title|deal|předmět/ }, { key: 'organization', label: __('Firma'), re: /firma|company|spole[cč]nost|organizace/ },
      { key: 'ico', label: __('IČO'), re: /i[cč]o/ }, { key: 'first_name', label: __('Jméno'), re: /jm[eé]no|first|křestní/ },
      { key: 'last_name', label: __('Příjmení'), re: /p[rř][ií]jmen|last|surname/ }, { key: 'email', label: __('E-mail'), re: /mail/ },
      { key: 'mobile_no', label: __('Telefon'), re: /tel|mobil|phone/ }, { key: 'order_value', label: __('Hodnota (Kč)'), re: /hodnota|cena|č[aá]stka|value|amount|kč/ },
      { key: 'status', label: __('Stav'), re: /stav|status|f[aá]ze/ }, { key: 'source', label: __('Zdroj'), re: /zdroj|source/ },
      { key: 'lead_owner', label: __('Vlastník (e-mail nebo jméno)'), re: /vlastn[ií]k|obchodn[ií]k|owner/ }, { key: 'order_description', label: __('Popis'), re: /popis|pozn[aá]mk|description|note/ },
    ],
    ready: (m) => m.organization !== '' || m.ico !== '' || m.first_name !== '' || m.last_name !== '',
    preview: 'growupcrm.data_import.preview',
    commit: 'growupcrm.data_import.commit',
    newLabel: __('nových zakázek'), mergeLabel: __('už v CRM – přeskočíme'), itemLabel: __('Zakázka'),
    status: { ...STATUS, 'sloučit': __('už je') },
    result: (r) => __('Nových zakázek: {0} · už v CRM: {1} · přeskočených: {2}', [r.created, r.skipped, r.failed]),
  },
}
const K = computed(() => KINDS[props.kind] || KINDS.contact)
const FIELDS = K.value.fields
const step = ref(0)
const fileName = ref('')
const header = ref([])
const raw = ref([])
const map = reactive(Object.fromEntries(FIELDS.map((f) => [f.key, ''])))
const preview = ref(null)
const result = ref(null)
const busy = ref(false)
const error = ref('')
const toCampaign = ref(false)
const campaign = ref('')
const campaigns = createResource({ url: 'growupcrm.outreach.get_campaigns', onSuccess: (d) => (campaign.value = d?.[0]?.name || '') })

const rows = computed(() => raw.value.map((r) => Object.fromEntries(FIELDS.map((f) => [f.key, map[f.key] === '' ? '' : (r[Number(map[f.key])] || '').trim()]))))
const canNext = computed(() => (step.value === 0 ? raw.value.length > 0 && !loading.value : K.value.ready(map)))
const args = (extra = {}) => ({ rows: JSON.stringify(rows.value), ...(props.kind === 'contact' ? {} : { kind: props.kind }), ...extra })

function downloadSample() {
  const csv = '\ufeff' + FIELDS.map((f) => f.label).join(';') + '\n'
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = `${K.value.title.toLowerCase().replace(/\s+/g, '-')}-vzor.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

const sheets = ref([])
const sheet = ref('')
const loading = ref(false)
let xlsxContent = ''

function setRows(all) {
  header.value = all[0] || []
  raw.value = all.slice(1)
  for (const f of FIELDS) map[f.key] = guessColumn(header.value, f.re)
}
async function loadSheet() {
  loading.value = true
  error.value = ''
  try {
    const res = await call('growupcrm.data_import.read_xlsx', { content: xlsxContent, sheet: sheet.value || undefined })
    sheets.value = res.sheets
    sheet.value = res.sheet
    setRows(res.rows)
  } catch (e) {
    error.value = e.messages?.[0] || e.message
    setRows([])
  } finally {
    loading.value = false
  }
}
function read(file) {
  if (!file) return
  fileName.value = file.name
  sheets.value = []
  sheet.value = ''
  error.value = ''
  const reader = new FileReader()
  if (/\.xlsx$/i.test(file.name)) {
    // Excel čte server (openpyxl), prohlížeč pošle soubor v base64
    reader.onload = () => {
      xlsxContent = reader.result
      loadSheet()
    }
    reader.readAsDataURL(file)
    return
  }
  if (/\.xls$/i.test(file.name)) {
    error.value = __('Starší formát .xls neumíme, uložte soubor v Excelu jako .xlsx.')
    return
  }
  reader.onload = () => setRows(parseCsv(reader.result))
  reader.readAsText(file)
}
const onDrop = (e) => read(e.dataTransfer?.files?.[0])

async function next() {
  error.value = ''
  if (step.value === 1) {
    busy.value = true
    try {
      preview.value = await call(K.value.preview, args())
    } catch (e) {
      error.value = e.messages?.[0] || e.message
      busy.value = false
      return
    }
    busy.value = false
  }
  step.value++
  if (step.value === 2 && props.kind === 'contact' && outreachEnabled.value && !campaigns.data) campaigns.fetch()
}
async function run() {
  busy.value = true
  error.value = ''
  try {
    result.value = await call(K.value.commit, args(props.kind === 'contact' ? { campaign: toCampaign.value ? campaign.value : undefined } : {}))
    step.value = 3
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    busy.value = false
  }
}
function done() {
  emit('done')
  show.value = false
}
</script>
