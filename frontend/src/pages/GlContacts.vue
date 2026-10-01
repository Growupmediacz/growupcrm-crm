<template>
  <!-- GrowUp: Kontakty podle designu – seznam vlevo, karta vybraného kontaktu vpravo.
       Tabulka CRM (filtry, sloupce, uložené pohledy) zůstává na /contacts/view/list. -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-3">
        <span class="text-lg-medium shrink-0 text-ink-gray-9">{{ __('Kontakty') }}</span>
        <div class="gl-seg hidden shrink-0 sm:inline-flex">
          <button class="gl-seg-btn gl-seg-on"><GlIcon name="grid" :size="15" />{{ __('Karty') }}</button>
          <router-link class="gl-seg-btn" :to="{ name: 'Contacts', params: { viewType: 'list' } }">
            <GlIcon name="list" :size="15" />{{ __('Tabulka') }}
          </router-link>
        </div>
      </div>
    </template>
    <template #right-header>
      <Button iconLeft="upload" class="hidden md:inline-flex" @click="openImport">{{ __('Importovat') }}</Button>
      <Button variant="solid" iconLeft="plus" @click="showContactModal = true">
        <span class="hidden sm:inline">{{ __('Nový kontakt') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <div class="flex min-h-0 flex-1 gap-3 overflow-hidden px-2 pb-2">
    <!-- seznam -->
    <div
      class="gl-card flex min-h-0 w-full flex-col p-3 md:w-[360px] md:shrink-0"
      :class="selected && isMobileView ? 'hidden' : ''"
    >
      <label class="flex h-10 items-center gap-2 rounded-2xl bg-[rgba(110,120,200,.08)] px-3">
        <GlIcon name="search" :size="16" class="text-ink-gray-5" />
        <input v-model="q" class="gl-chip-input flex-1 text-[14px]" :placeholder="__('Jméno, firma, telefon')" />
      </label>
      <div class="mt-2 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        <button
          v-for="c in directory.data || []"
          :key="c.name"
          class="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition"
          :class="selected === c.name ? 'bg-white shadow-[0_6px_18px_-10px_rgba(40,40,120,.35)]' : 'hover:bg-white/55'"
          @click="select(c.name)"
        >
          <img v-if="c.image" :src="c.image" class="size-10 shrink-0 rounded-full object-cover" />
          <span v-else class="flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" :class="tone(c.full_name)">
            {{ initials(c.full_name || c.name) }}
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-semibold text-ink-gray-9">{{ c.full_name || c.name }}</span>
            <span class="block truncate text-[12.5px] text-ink-gray-5">{{ sub(c) }}</span>
          </span>
        </button>
        <div v-if="directory.data && !directory.data.length" class="px-3 py-6 text-center text-[14px] text-ink-gray-5">
          {{ q ? __('Nic nenalezeno.') : __('Zatím žádné kontakty.') }}
        </div>
      </div>
    </div>

    <!-- karta -->
    <div v-if="card.data" class="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden" :class="!selected && isMobileView ? 'hidden' : ''">
      <button v-if="isMobileView" class="self-start text-[15px] font-semibold text-[#4f46e5]" @click="selected = ''">
        ‹ {{ __('Kontakty') }}
      </button>
      <div class="gl-card flex flex-col items-center px-6 py-7 text-center">
        <img v-if="c.image" :src="c.image" class="size-20 rounded-full object-cover" />
        <span v-else class="flex size-20 items-center justify-center rounded-full text-[26px] font-bold" :class="tone(c.full_name)">
          {{ initials(c.full_name) }}
        </span>
        <router-link :to="{ name: 'Contact', params: { contactId: c.name } }" class="mt-3 text-[28px] font-bold tracking-tight text-ink-gray-9 hover:text-[#4f46e5]">
          {{ c.full_name }}
        </router-link>
        <div class="text-[15px] text-ink-gray-7">
          {{ [c.designation, c.crm_organization || c.company_name].filter(Boolean).join(' · ') }}
        </div>
        <div class="mt-5 grid w-full max-w-[460px] grid-cols-4 gap-2.5">
          <a
            v-for="a in actions"
            :key="a.label"
            :href="a.href"
            class="gl-round flex flex-col items-center gap-1.5 rounded-2xl py-3 text-[13px] font-bold"
            :class="a.disabled && 'pointer-events-none opacity-40'"
            @click="a.onClick && ($event.preventDefault(), a.onClick())"
          >
            <GlIcon :name="a.icon" :size="20" class="text-[#4f46e5]" />{{ a.label }}
          </a>
        </div>
      </div>

      <div class="grid min-w-0 gap-3 lg:grid-cols-2">
        <div class="gl-card min-w-0 p-6">
          <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Údaje') }}</h2>
          <dl class="flex flex-col">
            <div v-for="r in details" :key="r.label" class="flex items-baseline justify-between gap-4 py-[7px]">
              <dt class="shrink-0 text-[14px] text-ink-gray-5">{{ r.label }}</dt>
              <dd class="min-w-0 truncate text-right text-[14px] font-medium text-ink-gray-9">
                <a v-if="r.href" :href="r.href" target="_blank" class="font-semibold text-[#4f46e5] hover:underline">{{ r.value }}</a>
                <template v-else-if="r.value">
                  {{ r.value }}
                  <span v-if="r.sub" class="block text-[12px] font-normal text-ink-gray-5">{{ r.sub }}</span>
                </template>
                <span v-else class="gl-empty">{{ __('Bez hodnoty') }}</span>
              </dd>
            </div>
          </dl>
          <router-link :to="{ name: 'Contact', params: { contactId: c.name } }" class="mt-3 inline-block text-[13px] font-semibold text-[#4f46e5] hover:underline">
            {{ __('Upravit údaje') }}
          </router-link>
        </div>

        <div class="gl-card min-w-0 p-6">
          <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Poslední aktivita') }}</h2>
          <div v-if="!card.data.activity.length" class="text-[14px] text-ink-gray-5">{{ __('Zatím žádná aktivita.') }}</div>
          <component
            :is="a.lead ? 'router-link' : 'div'"
            v-for="(a, i) in card.data.activity"
            :key="i"
            :to="a.lead ? { name: 'Lead', params: { leadId: a.lead } } : undefined"
            class="flex items-center gap-3 rounded-2xl py-2"
          >
            <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="KIND[a.kind].tone">
              <GlIcon :name="KIND[a.kind].icon" :size="18" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-[15px] font-semibold text-ink-gray-9">{{ a.title }}</span>
                <span v-if="a.badge" class="rounded-full bg-[rgba(224,161,0,.18)] px-2 py-0.5 text-[11px] font-bold text-[#915200]">{{ a.badge }}</span>
                <span v-if="a.upcoming" class="rounded-full bg-[rgba(79,70,229,.12)] px-2 py-0.5 text-[11px] font-bold text-[#4338ca]">{{ __('Naplánováno') }}</span>
              </span>
              <span class="block truncate text-[12.5px] text-ink-gray-5">{{ a.text || when(a.date) }}</span>
            </span>
          </component>
          <div v-if="card.data.leads.length" class="mt-3 border-t border-[rgba(110,120,200,.14)] pt-3">
            <div class="mb-1 text-[12px] font-bold text-ink-gray-5">{{ __('Zakázky') }}</div>
            <router-link
              v-for="l in card.data.leads"
              :key="l.name"
              :to="{ name: 'Lead', params: { leadId: l.name } }"
              class="flex items-center justify-between gap-3 py-1 text-[14px] hover:text-[#4f46e5]"
            >
              <span class="truncate font-medium">{{ l.order_title || l.lead_name || l.name }}</span>
              <span class="shrink-0 text-[12.5px] text-ink-gray-5">{{ __(l.status) }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    <div v-else-if="!isMobileView" class="gl-card flex flex-1 items-center justify-center text-[15px] text-ink-gray-5">
      {{ __('Vyberte kontakt vlevo.') }}
    </div>
  </div>

  <ContactModal
    v-if="showContactModal"
    v-model="showContactModal"
    :contact="{}"
    :options="{ redirect: false, afterInsert: (doc) => (directory.reload(), select(doc.name)) }"
  />
  <CalendarEventModal
    v-if="showEvent"
    v-model="showEvent"
    :organization="c.crm_organization || null"
    :subject="__('Schůzka: {0}', [c.full_name])"
    :start="tomorrowTen"
    :currentUser="sessionUser"
    :users="calendarUsers.data || []"
    @saved="card.reload()"
  />
  <Dialog v-model:open="showNote" :title="__('Zápis')">
    <template #default>
      <FormControl v-model="noteText" type="textarea" :rows="5" :placeholder="__('Co jste probrali…')" />
      <div class="mt-2 text-[12px] text-ink-gray-5">{{ noteTarget }}</div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showNote = false" />
        <Button variant="solid" :label="__('Uložit zápis')" :loading="savingNote" :disabled="!noteText.trim()" @click="saveNote" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import ContactModal from '@/components/Modals/ContactModal.vue'
import { isMobileView } from '@/composables/settings'
import { sessionStore } from '@/stores/session'
import { Button, Dialog, FormControl, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const sessionUser = sessionStore().user

usePageMeta(() => ({ title: __('Kontakty') }))

const q = ref('')
const selected = ref(route.query.contact || '')
const showContactModal = ref(false)
const showEvent = ref(false)
const showNote = ref(false)
const noteText = ref('')
const savingNote = ref(false)

const directory = createResource({
  url: 'growupcrm.contacts.get_directory',
  makeParams: () => ({ q: q.value }),
  auto: true,
  onSuccess(rows) {
    if (!selected.value && rows.length && !isMobileView.value) select(rows[0].name)
  },
})
let timer = null
watch(q, () => {
  clearTimeout(timer)
  timer = setTimeout(() => directory.reload(), 250)
})

const card = createResource({ url: 'growupcrm.contacts.get_card' })
function select(name) {
  selected.value = name
  router.replace({ query: { ...route.query, contact: name } })
}
watch(selected, (name) => name && card.fetch({ name }), { immediate: true })

const c = computed(() => card.data?.contact || {})
const phone = computed(() => c.value.mobile_no || c.value.phone || '')

const actions = computed(() => [
  { label: __('Zavolat'), icon: 'phone', href: phone.value ? `tel:${phone.value}` : undefined, disabled: !phone.value },
  { label: __('E-mail'), icon: 'mail', href: c.value.email_id ? `mailto:${c.value.email_id}` : undefined, disabled: !c.value.email_id },
  { label: __('Schůzka'), icon: 'cal', onClick: () => (showEvent.value = true) },
  { label: __('Zápis'), icon: 'doc', onClick: () => ((noteText.value = ''), (showNote.value = true)) },
])

const dash = ''
const details = computed(() => [
  { label: __('Mobil'), value: phone.value || dash },
  { label: __('E-mail'), value: c.value.email_id || dash, href: c.value.email_id ? `mailto:${c.value.email_id}` : null },
  { label: __('LinkedIn'), value: c.value.linkedin ? __('Profil') : dash, href: c.value.linkedin || null },
  { label: __('Preferuje'), value: c.value.preferred_contact || dash },
  { label: __('Typ'), value: c.value.contact_type ? __(c.value.contact_type) : dash },
  // bez pobočky se řádek nezobrazí
  ...(c.value.branch ? [{ label: __('Pobočka'), value: c.value.branch.name, sub: c.value.branch.address }] : []),
])

const noteTarget = computed(() =>
  card.data?.leads?.length
    ? __('Uloží se k zakázce {0}.', [card.data.leads[0].order_title || card.data.leads[0].lead_name || card.data.leads[0].name])
    : __('Uloží se ke kontaktu.'),
)
async function saveNote() {
  savingNote.value = true
  try {
    await call('growupcrm.contacts.add_note', { contact: c.value.name, content: noteText.value })
    toast.success(__('Zápis byl uložen'))
    showNote.value = false
    card.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    savingNote.value = false
  }
}

const calendarUsers = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const tomorrowTen = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})

function openImport() {
  router.push({ name: 'NewDataImport', params: { doctype: 'Contact' } })
}

const KIND = {
  call: { icon: 'phone', tone: 'bg-[#fde8dc] text-[#c2410c]' },
  event: { icon: 'cal', tone: 'bg-[#e6ecff] text-[#2e5bd8]' },
  note: { icon: 'doc', tone: 'bg-[#efe7ff] text-[#6d3fd0]' },
}
const TONES = ['bg-[#dde6ff] text-[#2e4bb8]', 'bg-[#ffe9d6] text-[#b4560f]', 'bg-[#efe7ff] text-[#6d3fd0]', 'bg-[#dcf5e6] text-[#15803d]']
const tone = (s) => TONES[[...(s || '')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TONES.length]
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
const sub = (row) => [row.designation, row.crm_organization || row.company_name].filter(Boolean).join(' · ') || row.email_id || ''
const when = (d) => {
  if (!d) return ''
  const x = new Date(String(d).replace(' ', 'T'))
  return x.toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
