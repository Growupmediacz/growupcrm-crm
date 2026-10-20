<template>
  <!-- GrowUp: Firma → Dokumenty (growupcrm.documents): nahrané k firmě, přílohy zakázek a odeslaných e-mailů -->
  <div>
    <div class="mb-4 flex flex-wrap items-center gap-1.5">
      <button
        v-for="t in typeFilters"
        :key="t.key"
        class="rounded-full border px-3.5 py-1 text-[14px] font-medium transition"
        :class="filter === t.key ? 'border-[#0e1330] bg-[#0e1330] text-white' : 'border-white/80 bg-white/55 text-ink-gray-7 hover:bg-white/80'"
        @click="filter = t.key"
      >
        {{ t.label }}
      </button>
      <div class="ml-auto flex items-center gap-2">
        <input v-model="search" class="gl-field h-9 w-48" :placeholder="__('Hledat dokument…')" />
        <Dropdown :options="uploadOptions" placement="right">
          <Button variant="solid" iconLeft="upload" :label="__('Nahrát dokument')" :loading="uploading" />
        </Dropdown>
      </div>
    </div>
    <input ref="fileInput" type="file" class="hidden" @change="onFile" />
    <p class="-mt-2 mb-3 text-[12px] text-ink-gray-5">
      {{ __('Max. {0} MB na soubor. Smlouvy, nabídky a ceníky nejlépe jako PDF. Přílohy e-mailů ze zakázek se sem přidávají samy.', [maxMb]) }}
    </p>

    <GlSkeleton v-if="docs.loading && !docs.data" :rows="3" />
    <GlEmptyState
      v-else-if="!list.length"
      class="my-6"
      icon="doc"
      :title="search || filter !== 'all' ? __('Nic nenalezeno') : __('Zatím žádné dokumenty')"
      :text="__('Nahrajte smlouvu, nabídku nebo ceník. Najdete je tu i za půl roku.')"
    />
    <div v-for="d in list" v-else :key="d.name" class="mb-2 flex items-start gap-3 rounded-2xl bg-white/55 px-3 py-2.5">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-xl text-[11px] font-bold uppercase" :class="extTone(d.file_name)">
        {{ ext(d.file_name) || '—' }}
      </span>
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <a :href="d.file_url" target="_blank" rel="noopener" class="truncate text-[15px] font-semibold text-ink-gray-9 hover:underline">{{ d.file_name }}</a>
          <Dropdown v-if="d.source === 'organization'" :options="typeOptions(d)">
            <button class="rounded-full bg-[rgba(110,120,200,.12)] px-2 py-0.5 text-[12px] font-semibold text-[#2440a6]">
              {{ d.doc_type || __('Bez typu') }} ▾
            </button>
          </Dropdown>
          <span v-else-if="d.doc_type" class="rounded-full bg-[rgba(110,120,200,.12)] px-2 py-0.5 text-[12px] font-semibold text-[#2440a6]">{{ d.doc_type }}</span>
          <span v-if="d.source === 'email'" class="rounded-full px-2 py-0.5 text-[12px] font-semibold" :class="d.direction === 'Received' ? 'bg-[rgba(34,179,94,.12)] text-[#178a4a]' : 'bg-[rgba(79,70,229,.1)] text-[#4338ca]'">
            {{ d.direction === 'Received' ? __('Přijato e-mailem') : __('Odesláno e-mailem') }}
          </span>
        </div>
        <div class="mt-0.5 text-[13px] text-ink-gray-6">
          <template v-if="d.source === 'email'">
            {{ dateFmt(d.date) }} · {{ d.direction === 'Received' ? __('od') : __('komu') }} {{ d.email_to }}
            <span v-if="d.email_subject"> · „{{ d.email_subject }}“</span>
          </template>
          <template v-else>
            {{ d.source === 'lead' ? __('Příloha zakázky') : __('Nahráno k firmě') }} · {{ dateFmt(d.date) }}<span v-if="d.owner_name"> · {{ d.owner_name }}</span>
          </template>
          <router-link v-if="d.lead" :to="{ name: 'Lead', params: { leadId: d.lead } }" class="text-ink-blue-5 hover:underline"> · {{ d.lead_title }}</router-link>
          <span class="text-ink-gray-5"> · {{ sizeFmt(d.file_size) }}</span>
        </div>
      </div>
      <Button v-if="d.source === 'organization'" variant="ghost" icon="trash-2" :aria-label="__('Smazat')" @click="remove(d)" />
    </div>
  </div>
</template>

<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import { saveFailed } from '@/composables/glToast'
import { Button, Dropdown, call, createResource, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ organization: { type: String, required: true } })
const emit = defineEmits(['changed'])

const docs = createResource({ url: 'growupcrm.documents.get_documents', params: { organization: props.organization }, auto: true })
defineExpose({ docs })

const maxMb = computed(() => docs.data?.max_mb || 5)
const docTypes = computed(() => docs.data?.doc_types || ['Smlouva', 'Nabídka', 'Ceník', 'Objednávka', 'Faktura', 'Podklady', 'Jiné'])
const filter = ref('all')
const search = ref('')

const typeFilters = computed(() => {
  const present = new Set((docs.data?.documents || []).map((d) => d.doc_type).filter(Boolean))
  return [
    { key: 'all', label: __('Vše') },
    ...docTypes.value.filter((t) => present.has(t)).map((t) => ({ key: t, label: t })),
    ...((docs.data?.documents || []).some((d) => d.source === 'email') ? [{ key: 'email', label: __('Z e-mailů') }] : []),
  ]
})
const list = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (docs.data?.documents || []).filter((d) => {
    if (filter.value === 'email' && d.source !== 'email') return false
    if (!['all', 'email'].includes(filter.value) && d.doc_type !== filter.value) return false
    return !q || [d.file_name, d.email_subject, d.lead_title, d.doc_type].some((v) => (v || '').toLowerCase().includes(q))
  })
})

// nahrání: nejdřív typ dokumentu, pak výběr souboru; velikost se hlídá hned v prohlížeči (server ji hlídá znovu)
const fileInput = ref(null)
const pendingType = ref('')
const uploading = ref(false)
const uploadOptions = computed(() => docTypes.value.map((t) => ({ label: t, onClick: () => pick(t) })))
function pick(type) {
  pendingType.value = type
  fileInput.value.value = ''
  fileInput.value.click()
}
async function onFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const limit = maxMb.value * 1024 * 1024
  if (file.size > limit) {
    toast.error(
      __('Soubor má {0} MB, maximum je {1} MB. Zkomprimujte ho prosím (např. uložte PDF ve zmenšené velikosti) a nahrajte znovu.', [
        (file.size / 1024 / 1024).toFixed(1).replace('.', ','),
        maxMb.value,
      ]),
      { duration: 10000 },
    )
    return
  }
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file, file.name)
    form.append('is_private', '1')
    form.append('doctype', 'CRM Organization')
    form.append('docname', props.organization)
    const res = await fetch('/api/method/upload_file', {
      method: 'POST',
      body: form,
      headers: { Accept: 'application/json', 'X-Frappe-CSRF-Token': window.csrf_token },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(serverMessage(data) || __('Nahrání se nepovedlo'))
    await call('growupcrm.documents.set_doc_type', { organization: props.organization, file: data.message.name, doc_type: pendingType.value })
    toast.success(__('Dokument je nahraný'))
    docs.reload()
    emit('changed')
  } catch (err) {
    toast.error(err.message || __('Nahrání se nepovedlo'))
  } finally {
    uploading.value = false
  }
}
function serverMessage(data) {
  try {
    return JSON.parse(JSON.parse(data._server_messages)[0]).message
  } catch {
    return data?.exception?.split(':').slice(1).join(':').trim()
  }
}

function typeOptions(d) {
  return docTypes.value.map((t) => ({
    label: t,
    onClick: async () => {
      try {
        await call('growupcrm.documents.set_doc_type', { organization: props.organization, file: d.name, doc_type: t })
        d.doc_type = t
      } catch (e) {
        saveFailed(e)
      }
    },
  }))
}
async function remove(d) {
  if (!window.confirm(__('Smazat dokument {0}?', [d.file_name]))) return
  try {
    await call('growupcrm.documents.delete_document', { organization: props.organization, file: d.name })
    toast.success(__('Dokument je smazaný'))
    docs.reload()
    emit('changed')
  } catch (e) {
    saveFailed(e, null, __('Smazání se nepovedlo'))
  }
}

const ext = (n) => ((n || '').includes('.') ? n.split('.').pop().slice(0, 4) : '')
const extTone = (n) => {
  const e = ext(n).toLowerCase()
  if (e === 'pdf') return 'bg-[rgba(229,72,77,.12)] text-[#b42318]'
  if (['doc', 'docx', 'odt'].includes(e)) return 'bg-[rgba(59,110,246,.13)] text-[#1f48b8]'
  if (['xls', 'xlsx', 'csv', 'ods'].includes(e)) return 'bg-[rgba(34,179,94,.13)] text-[#178a4a]'
  return 'bg-[rgba(110,120,200,.12)] text-[#4a5173]'
}
const fmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' })
const dateFmt = (d) => (d ? fmt.format(new Date(String(d).replace(' ', 'T'))) : '')
const sizeFmt = (b) => (!b ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} kB` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} MB`)
</script>
