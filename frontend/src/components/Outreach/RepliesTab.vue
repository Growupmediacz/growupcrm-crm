<template>
  <!-- GrowUp (design 2. kolo, O5): odpovědi – seznam vlevo, vlákno a akce vpravo -->
  <div class="grid min-h-0 flex-1 gap-4 lg:grid-cols-[380px_1fr]">
    <div class="gl-card flex min-h-0 flex-col p-3" :class="current && isMobileView ? 'hidden' : ''">
      <div class="mb-2 flex gap-1.5 px-1">
        <button v-for="f in FILTERS" :key="f.key" class="gl-chip h-9 rounded-full px-3.5 text-[14px] font-medium" :class="filter === f.key && '!border-[#0e1330] !bg-[#0e1330] !text-white'" @click="filter = f.key">
          {{ f.label }}<span v-if="f.key === 'open' && list.data?.length" class="num ml-1 opacity-80">{{ list.data.length }}</span>
        </button>
      </div>
      <p v-if="!list.data?.length" class="px-3 py-8 text-center text-[14px] text-ink-gray-5">{{ __('Žádné odpovědi.') }}</p>
      <div class="flex-1 overflow-y-auto">
        <button v-for="r in list.data || []" :key="r.name" class="mb-1 flex w-full gap-3 rounded-2xl px-3 py-3 text-left transition" :class="current?.name === r.name ? 'bg-white shadow-[0_2px_10px_-4px_rgba(64,72,160,.3)]' : 'hover:bg-white/60'" @click="select(r.name)">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" :style="avatarTone(r.contact_name)">{{ initials(r.contact_name) }}</span>
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-2"><b class="truncate text-[16px] text-ink-gray-9">{{ r.contact_name }}</b><span class="num shrink-0 text-[12px] text-ink-gray-5">{{ whenLabel(r.sent_at) }}</span></span>
            <span class="block truncate text-[13px] text-ink-gray-5">{{ r.organization }} · {{ __('krok {0}', [r.step_index + 1]) }}</span>
            <span class="block truncate text-[14px] text-ink-gray-7">„{{ plain(r.body) }}“</span>
            <span v-if="r.reply_label" class="mt-1 inline-block rounded-full px-2.5 py-0.5 text-[12px] font-bold" :class="REPLY_LABEL[r.reply_label]">{{ __(r.reply_label) }}</span>
          </span>
        </button>
      </div>
    </div>

    <div v-if="current" class="gl-card flex min-h-0 flex-col overflow-y-auto p-5 md:p-6">
      <button v-if="isMobileView" class="mb-3 self-start text-[14px] font-semibold text-[#4F46E5]" @click="selected = ''">‹ {{ __('Odpovědi') }}</button>
      <div class="flex items-start gap-3">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold" :style="avatarTone(current.contact_name)">{{ initials(current.contact_name) }}</span>
        <div class="min-w-0 flex-1">
          <div class="truncate text-[16px] font-bold text-ink-gray-9">{{ current.contact_name }}<template v-if="current.designation"> · {{ current.designation }}</template></div>
          <div class="truncate text-[13px] text-ink-gray-5">{{ current.organization }} · {{ current.campaign_name }}, {{ __('krok {0}', [current.step_index + 1]) }} · {{ __('sekvence zastavena') }}</div>
        </div>
        <Dropdown :options="labelOptions" placement="right">
          <button class="rounded-full px-3 py-1 text-[12px] font-bold" :class="current.reply_label ? REPLY_LABEL[current.reply_label] : 'bg-[rgba(110,120,200,.14)] text-ink-gray-7'">{{ current.reply_label ? __(current.reply_label) : __('Roztřídit') }}</button>
        </Dropdown>
      </div>

      <div class="mt-4 rounded-2xl bg-[rgba(110,120,200,.1)] p-4">
        <div class="mb-1 text-[12px] text-ink-gray-5">{{ whenLabel(current.sent_at) }}</div>
        <div lang="cs" class="gl-text whitespace-pre-line text-[15px] leading-relaxed text-ink-gray-9">{{ plain(current.body) }}</div>
      </div>
      <div v-if="current.original" class="mt-3 rounded-2xl border border-dashed border-[rgba(110,120,200,.35)] p-4">
        <div class="mb-1 text-[12px] text-ink-gray-5">{{ __('Vy') }} · {{ current.original.step }}. {{ __('e-mail') }} · {{ current.original.subject }}</div>
        <div lang="cs" class="gl-text line-clamp-3 text-[14px] text-ink-gray-7">{{ plain(current.original.body) }}</div>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <Button variant="solid" iconLeft="briefcase" :loading="busy === 'lead'" :disabled="!!current.lead" @click="createLead">{{ current.lead ? __('Zakázka založena') : __('Vytvořit zakázku') }}</Button>
        <Button iconLeft="calendar" @click="showEvent = true">{{ __('Naplánovat schůzku') }}</Button>
        <a :href="mailto" class="inline-flex"><Button iconLeft="corner-up-left">{{ __('Odpovědět') }}</Button></a>
        <Button variant="subtle" theme="red" iconLeft="x" @click="unsub">{{ __('Odhlásit') }}</Button>
        <Button iconLeft="check" @click="resolve">{{ __('Vyřízeno') }}</Button>
      </div>
      <p class="mt-3 text-[13px] text-ink-gray-5">{{ __('Zakázka se založí s firmou, kontaktem a celým vláknem. Kontakt se z kampaně vyřadí automaticky – odpověď sekvenci zastavila.') }}</p>
    </div>
    <div v-else-if="!isMobileView" class="gl-card flex items-center justify-center p-10 text-[15px] text-ink-gray-5">{{ __('Vyberte odpověď vlevo.') }}</div>
  </div>

  <CalendarEventModal
    v-if="showEvent && current"
    v-model="showEvent"
    :organization="current.organization_id || null"
    :subject="__('Schůzka: {0}', [current.contact_name])"
    :start="tomorrow"
    :currentUser="sessionUser"
    :users="users.data || []"
    @saved="meetingBooked"
  />
</template>

<script setup>
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import { api, avatarTone, initials, plain, REPLY_LABEL, whenLabel } from '@/composables/outreach'
import { isMobileView } from '@/composables/settings'
import { sessionStore } from '@/stores/session'
import { Button, Dropdown, createResource, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ selected: { type: String, default: '' } })
const emit = defineEmits(['changed'])
const router = useRouter()
const FILTERS = [
  { key: 'open', label: __('Nevyřízené') },
  { key: 'done', label: __('Vyřízené') },
  { key: 'all', label: __('Vše') },
]
const filter = ref('open')
const selected = ref(props.selected)
const busy = ref('')
const showEvent = ref(false)
const sessionUser = sessionStore().user
const users = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const list = createResource({ url: 'growupcrm.outreach.get_replies', params: { filter: 'open' }, auto: true })
watch(filter, (f) => list.fetch({ filter: f }))
watch(() => props.selected, (v) => (selected.value = v))

const current = computed(() => (list.data || []).find((r) => r.name === selected.value) || (isMobileView.value ? null : (list.data || [])[0]) || null)
const select = (n) => (selected.value = n)
const tomorrow = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})
const mailto = computed(() => {
  const r = current.value
  return r ? `mailto:${r.email || ''}?subject=${encodeURIComponent('Re: ' + (r.original?.subject || ''))}` : '#'
})
const labelOptions = computed(() =>
  ['Zájem', 'Později', 'Automatická odpověď', 'Odmítnutí', ''].map((l) => ({
    label: l ? __(l) : __('Bez třídění'),
    onClick: async () => {
      await api('set_reply_label', { name: current.value.name, label: l })
      list.reload()
    },
  })),
)

async function after() {
  await list.reload()
  emit('changed')
}
async function createLead() {
  busy.value = 'lead'
  try {
    const { lead } = await api('create_lead_from_reply', { name: current.value.name })
    toast.success(__('Zakázka byla založena'))
    router.push({ name: 'Lead', params: { leadId: lead } })
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    busy.value = ''
  }
}
async function meetingBooked() {
  await api('mark_meeting', { name: current.value.name })
  after()
}
async function unsub() {
  if (!window.confirm(__('Kontakt už nikdy neoslovíme. Odhlásit?'))) return
  await api('unsubscribe_from_reply', { name: current.value.name })
  after()
}
async function resolve() {
  await api('resolve_reply', { name: current.value.name })
  after()
}
</script>
