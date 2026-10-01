<template>
  <!-- GrowUp (design 2. kolo, O4): Přidat kontakty do kampaně – z CRM, CSV, ARES podle IČO, z webu (brzy) -->
  <Dialog v-model:open="show" :title="__('Přidat kontakty do kampaně')" :options="{ size: '4xl' }">
    <template #default>
      <p class="-mt-3 mb-4 text-[13px] text-ink-gray-5">{{ campaignName }} · {{ __('{0} kontaktů', [total]) }}</p>
      <div class="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <button v-for="s in SOURCES" :key="s.key" type="button" class="flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition" :class="[source === s.key ? 'border-[#4F46E5] bg-[rgba(79,70,229,.08)]' : 'border-white/90 bg-white/70 hover:bg-white', s.soon && 'opacity-60']" :disabled="s.soon" @click="source = s.key">
          <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(110,120,200,.12)]"><GlIcon :name="s.icon" :size="17" /></span>
          <span class="min-w-0"><span class="block text-[14px] font-bold" :class="source === s.key ? 'text-[#4338ca]' : 'text-ink-gray-9'">{{ s.label }}</span><span class="block truncate text-[12px] text-ink-gray-5">{{ s.soon ? __('brzy') : s.hint }}</span></span>
        </button>
      </div>

      <!-- Z CRM -->
      <template v-if="source === 'crm'">
        <div class="mb-3 flex flex-wrap gap-2">
          <label class="gl-chip flex h-10 min-w-[200px] flex-1 items-center gap-2 rounded-full px-3.5"><GlIcon name="search" :size="15" class="opacity-60" /><input v-model="q" class="gl-chip-input w-full bg-transparent text-[14px]" :placeholder="__('Hledat firmu nebo osobu')" /></label>
          <select v-model="territory" class="gl-chip h-10 rounded-full px-3 text-[14px]"><option value="">{{ __('Kraj: Vše') }}</option><option v-for="t in lists.data?.territories || []" :key="t" :value="t">{{ t }}</option></select>
          <select v-model="industry" class="gl-chip h-10 rounded-full px-3 text-[14px]"><option value="">{{ __('Obor: Vše') }}</option><option v-for="i in lists.data?.industries || []" :key="i" :value="i">{{ i }}</option></select>
          <select v-model="relationship" class="gl-chip h-10 rounded-full px-3 text-[14px]"><option value="">{{ __('Stav: Vše') }}</option><option>Prospekt</option><option>Klient</option></select>
        </div>
        <div class="max-h-[330px] overflow-y-auto rounded-2xl bg-[rgba(110,120,200,.06)] p-1">
          <p v-if="!rows.length" class="py-8 text-center text-[14px] text-ink-gray-5">{{ __('Žádné kontakty podle filtru.') }}</p>
          <label v-for="r in rows" :key="r.contact" class="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/60" :class="[picked.has(r.contact) && 'bg-[rgba(79,70,229,.08)]', r.flag && 'cursor-not-allowed opacity-70']">
            <input type="checkbox" :disabled="!!r.flag" :checked="picked.has(r.contact)" @change="toggle(r.contact)" />
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :style="avatarTone(r.organization_name || r.full_name)">{{ initials(r.organization_name || r.full_name) }}</span>
            <span class="min-w-0 flex-1"><span class="block truncate text-[15px] font-bold text-ink-gray-9">{{ r.organization_name || r.full_name }}</span><span class="block truncate text-[13px] text-ink-gray-5">{{ r.full_name }}<template v-if="r.designation"> · {{ r.designation }}</template></span></span>
            <span class="hidden w-28 truncate text-[13px] text-ink-gray-7 sm:block">{{ r.territory }}</span>
            <span class="hidden w-28 truncate text-[13px] text-ink-gray-7 md:block">{{ r.industry }}</span>
            <span class="w-24 text-right text-[13px] font-semibold" :class="r.flag ? 'text-[#c8321f]' : 'text-ink-gray-7'">{{ r.flag || r.relationship }}</span>
          </label>
        </div>
      </template>

      <!-- CSV -->
      <template v-else-if="source === 'csv'">
        <div class="flex flex-col gap-3">
          <label class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-[rgba(110,120,200,.35)] px-4 py-8 text-center hover:bg-white/50">
            <GlIcon name="upload" :size="22" /><span class="text-[15px] font-semibold text-ink-gray-9">{{ csvName || __('Vyberte soubor CSV') }}</span>
            <span class="text-[13px] text-ink-gray-5">{{ __('Sloupce namapujete v dalším kroku. Odhlášené a duplicity se vynechají.') }}</span>
            <input type="file" accept=".csv,text/csv" class="hidden" @change="onFile" />
          </label>
          <div v-if="csv.header.length" class="grid grid-cols-2 gap-3 md:grid-cols-5">
            <label v-for="f in CSV_FIELDS" :key="f.key"><span class="gl-label">{{ f.label }}</span>
              <select v-model="map[f.key]" class="gl-field w-full"><option value="">{{ __('— nepoužít —') }}</option><option v-for="(h, i) in csv.header" :key="i" :value="i">{{ h }}</option></select></label>
          </div>
          <p v-if="csv.rows.length" class="text-[13px] text-ink-gray-5">{{ __('Načteno {0} řádků.', [csv.rows.length]) }}</p>
        </div>
      </template>

      <!-- ARES -->
      <template v-else-if="source === 'ares'">
        <div class="grid gap-3 md:grid-cols-2">
          <label><span class="gl-label">{{ __('IČO firmy') }}</span><input v-model="ares.ico" class="gl-field w-full tabular-nums" inputmode="numeric" maxlength="8" /></label>
          <label><span class="gl-label">{{ __('E-mail kontaktu') }}</span><input v-model="ares.email" class="gl-field w-full" type="email" /></label>
          <label><span class="gl-label">{{ __('Jméno') }}</span><input v-model="ares.first_name" class="gl-field w-full" /></label>
          <label><span class="gl-label">{{ __('Příjmení') }}</span><input v-model="ares.last_name" class="gl-field w-full" /></label>
        </div>
        <p class="mt-3 text-[13px] text-ink-gray-5">{{ __('Firmu načteme z ARES (název, adresa, kraj). ARES neobsahuje e-maily, proto kontakt zadejte ručně.') }}</p>
      </template>

      <div class="mt-4 flex flex-wrap items-center gap-2">
        <span v-if="source === 'crm'" class="rounded-full bg-[rgba(79,70,229,.12)] px-3 py-1 text-[13px] font-bold text-[#4338ca]">{{ __('{0} vybrané', [picked.size]) }}</span>
        <span v-if="flagCount('duplicita')" class="rounded-full bg-[rgba(224,161,0,.2)] px-3 py-1 text-[13px] font-bold text-[#915200]">{{ __('{0} duplicita vynechána', [flagCount('duplicita')]) }}</span>
        <span v-if="flagCount('odhlášen')" class="rounded-full bg-[rgba(200,50,31,.12)] px-3 py-1 text-[13px] font-bold text-[#c8321f]">{{ __('{0} odhlášený vynechán', [flagCount('odhlášen')]) }}</span>
      </div>
      <ErrorMessage class="mt-2" :message="error" />
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <span class="hidden text-[13px] text-ink-gray-5 sm:block">{{ __('Odhlášené a duplicity nikdy nepřidáme.') }}</span>
        <div class="ml-auto flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button variant="solid" iconLeft="plus" :loading="saving" :disabled="!canAdd" :label="addLabel" @click="add" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { api, avatarTone, initials } from '@/composables/outreach'
import { Button, Dialog, ErrorMessage, createResource, toast } from 'frappe-ui'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({ campaign: { type: String, required: true }, campaignName: { type: String, default: '' }, total: { type: Number, default: 0 } })
const emit = defineEmits(['added'])
const show = defineModel({ type: Boolean })

const SOURCES = [
  { key: 'crm', label: __('Z CRM'), hint: __('firmy a kontakty'), icon: 'building' },
  { key: 'csv', label: __('Import CSV'), hint: __('se mapováním'), icon: 'upload' },
  { key: 'ares', label: __('Z ARES'), hint: __('podle IČO'), icon: 'refresh' },
  { key: 'web', label: __('Z webu'), hint: __('brzy'), icon: 'globe', soon: true },
]
const source = ref('crm')
const saving = ref(false)
const error = ref('')

// Z CRM
const q = ref('')
const territory = ref('')
const industry = ref('')
const relationship = ref('')
const rows = ref([])
const picked = ref(new Set())
const lists = createResource({ url: 'growupcrm.firmy.get_form_lists', auto: true })
let timer
async function search() {
  rows.value = await api('search_candidates', { campaign: props.campaign, q: q.value, territory: territory.value, industry: industry.value, relationship: relationship.value })
}
watch([q, territory, industry, relationship], () => { clearTimeout(timer); timer = setTimeout(search, 250) })
search()
function toggle(c) {
  const s = new Set(picked.value)
  s.has(c) ? s.delete(c) : s.add(c)
  picked.value = s
}
const flagCount = (f) => (source.value === 'crm' ? rows.value.filter((r) => r.flag === f).length : 0)

// CSV
const CSV_FIELDS = [
  { key: 'first_name', label: __('Jméno') }, { key: 'last_name', label: __('Příjmení') }, { key: 'email', label: __('E-mail') },
  { key: 'company', label: __('Firma') }, { key: 'designation', label: __('Pozice') },
]
const csv = reactive({ header: [], rows: [] })
const map = reactive({ first_name: '', last_name: '', email: '', company: '', designation: '' })
const csvName = ref('')
function parseCsv(text) {
  const out = []
  let row = [], cur = '', q2 = false
  const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ','
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (q2) {
      if (ch === '"' && text[i + 1] === '"') (cur += '"'), i++
      else if (ch === '"') q2 = false
      else cur += ch
    } else if (ch === '"') q2 = true
    else if (ch === delim) (row.push(cur), (cur = ''))
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cur); cur = ''
      if (row.some((x) => x.trim())) out.push(row)
      row = []
    } else cur += ch
  }
  row.push(cur)
  if (row.some((x) => x.trim())) out.push(row)
  return out
}
function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  csvName.value = file.name
  const reader = new FileReader()
  reader.onload = () => {
    const all = parseCsv(String(reader.result).replace(/^﻿/, ''))
    csv.header = all[0] || []
    csv.rows = all.slice(1)
    // automatické mapování podle názvů sloupců
    const find = (re) => String(csv.header.findIndex((h) => re.test(h.toLowerCase())) >= 0 ? csv.header.findIndex((h) => re.test(h.toLowerCase())) : '')
    Object.assign(map, { first_name: find(/jm[eé]no|first/), last_name: find(/p[rř][ií]jmen|last|surname/), email: find(/mail/), company: find(/firma|company|spole[cč]nost/), designation: find(/pozice|funkce|title|position/) })
  }
  reader.readAsText(file)
}

// ARES
const ares = reactive({ ico: '', email: '', first_name: '', last_name: '' })

const canAdd = computed(() => (source.value === 'crm' ? picked.value.size > 0 : source.value === 'csv' ? csv.rows.length && map.email !== '' : source.value === 'ares' ? ares.ico && ares.email : false))
const addLabel = computed(() => (source.value === 'crm' ? __('Přidat {0} kontakty', [picked.value.size]) : __('Přidat')))

async function add() {
  error.value = ''
  saving.value = true
  try {
    let res
    if (source.value === 'crm') res = await api('add_contacts', { campaign: props.campaign, contacts: JSON.stringify([...picked.value]) })
    else {
      let items
      if (source.value === 'csv') {
        const v = (r, k) => (map[k] === '' ? '' : (r[Number(map[k])] || '').trim())
        items = csv.rows.map((r) => Object.fromEntries(CSV_FIELDS.map((f) => [f.key, v(r, f.key)])))
      } else {
        const org = await api('import_ares_company', { ico: ares.ico })
        items = [{ first_name: ares.first_name, last_name: ares.last_name, email: ares.email, company: org.organization_name }]
      }
      res = await api('import_rows', { campaign: props.campaign, rows: JSON.stringify(items) })
    }
    const skipped = Object.values(res.skipped).reduce((a, b) => a + b, 0)
    toast.success(__('Přidáno {0}{1}', [res.added, skipped ? __(', vynecháno {0}', [skipped]) : '']))
    emit('added')
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
</script>
