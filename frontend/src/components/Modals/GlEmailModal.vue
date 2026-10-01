<template>
  <!-- GrowUp (design 1. kolo DEmail): Nová zpráva jako okno vpravo dole – Komu, Předmět, Šablona, text, Odeslat -->
  <Teleport to="body">
    <div v-if="show" class="gl-sheet fixed bottom-4 right-4 z-[80] flex max-h-[85vh] w-[min(560px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[22px] max-md:inset-x-3 max-md:bottom-3 max-md:w-auto" role="dialog" :aria-label="__('Nová zpráva')">
      <div class="flex items-center justify-between border-b border-[rgba(110,120,200,.14)] px-5 py-3">
        <h3 class="text-[16px] font-bold text-ink-gray-9">{{ __('Nová zpráva') }}</h3>
        <div class="flex gap-1">
          <button class="flex size-8 items-center justify-center rounded-full hover:bg-black/5" :aria-label="__('Zavřít')" @click="show = false"><GlIcon name="x" :size="16" /></button>
        </div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="flex items-center gap-3 border-b border-[rgba(110,120,200,.12)] px-5 py-2.5">
          <span class="w-14 shrink-0 text-[14px] text-ink-gray-5">{{ __('Komu') }}</span>
          <span v-if="toName" class="flex shrink-0 items-center gap-2 rounded-full bg-white/80 py-0.5 pl-0.5 pr-3 text-[14px] font-medium text-ink-gray-9"><span class="flex size-6 items-center justify-center rounded-full bg-[#dde6ff] text-[9px] font-bold text-[#2e4bb8]">{{ initials(toName) }}</span>{{ toName }}</span>
          <input v-model="to" class="min-w-0 flex-1 bg-transparent text-[14px] outline-none" :placeholder="__('e-mail příjemce')" />
          <button class="shrink-0 text-[13px] text-ink-gray-5 hover:text-ink-gray-9" @click="showCc = !showCc">{{ __('Kopie') }}</button>
        </div>
        <div v-if="showCc" class="flex items-center gap-3 border-b border-[rgba(110,120,200,.12)] px-5 py-2.5"><span class="w-14 shrink-0 text-[14px] text-ink-gray-5">{{ __('Kopie') }}</span><input v-model="cc" class="min-w-0 flex-1 bg-transparent text-[14px] outline-none" /></div>
        <div class="flex items-center gap-3 border-b border-[rgba(110,120,200,.12)] px-5 py-2.5"><span class="w-14 shrink-0 text-[14px] text-ink-gray-5">{{ __('Předmět') }}</span><input v-model="subject" class="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink-gray-9 outline-none" /></div>
        <div v-if="templates.data?.length" class="flex items-center gap-3 border-b border-[rgba(110,120,200,.12)] px-5 py-2.5">
          <span class="w-14 shrink-0 text-[14px] text-ink-gray-5">{{ __('Šablona') }}</span>
          <div class="flex flex-wrap gap-1.5"><button v-for="t in templates.data" :key="t.name" class="rounded-full px-3 py-1 text-[13px] font-semibold" :class="template === t.name ? 'bg-[#0e1330] text-white' : 'bg-[rgba(79,70,229,.1)] text-[#4338ca]'" @click="applyTemplate(t)">{{ t.name }}</button></div>
        </div>
        <textarea v-model="body" class="gl-text block min-h-[200px] w-full resize-none bg-transparent px-5 py-4 text-[15px] leading-relaxed text-ink-gray-9 outline-none" lang="cs" :placeholder="__('Napište zprávu…')" />
        <ErrorMessage class="px-5 pb-2" :message="error" />
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-[rgba(110,120,200,.14)] px-5 py-3">
        <button class="gl-quick !h-11 !px-4 !text-[14px]" :disabled="sending" @click="show = false">{{ __('Zahodit') }}</button>
        <button class="inline-flex h-11 items-center gap-2 rounded-full bg-[#4F46E5] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)] disabled:opacity-50" :disabled="sending || !canSend" @click="send">
          <GlIcon name="send" :size="16" />{{ sending ? __('Odesílám…') : __('Odeslat') }}
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { usersStore } from '@/stores/users'
import { ErrorMessage, call, createListResource, toast } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({ lead: { type: Object, required: true }, toName: { type: String, default: '' } })
const emit = defineEmits(['sent'])
const show = defineModel({ type: Boolean })
const { getUser } = usersStore()

const to = ref(props.lead.email || '')
const cc = ref('')
const showCc = ref(false)
const subject = ref('')
const body = ref('')
const template = ref('')
const error = ref('')
const sending = ref(false)
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
const canSend = computed(() => /@/.test(to.value) && body.value.trim())

const templates = createListResource({
  doctype: 'Email Template',
  fields: ['name', 'subject', 'response', 'use_html'],
  filters: { enabled: 1, reference_doctype: 'CRM Lead' },
  pageLength: 20,
  auto: true,
})

// šablona se vyplní hodnotami zakázky (CRM ji umí vyrenderovat)
async function applyTemplate(t) {
  template.value = t.name
  try {
    const r = await call('frappe.email.doctype.email_template.email_template.get_email_template', { template_name: t.name, doc: props.lead })
    subject.value = r.subject || t.subject || subject.value
    body.value = new DOMParser().parseFromString((r.message || t.response || '').replace(/<br\s*\/?>|<\/p>/gi, '\n'), 'text/html').body.textContent.trim()
  } catch {
    subject.value = t.subject || subject.value
  }
}

watch(show, (open) => {
  if (open) {
    to.value = props.lead.email || ''
    subject.value = ''
    body.value = ''
    template.value = ''
    error.value = ''
  }
})

async function send() {
  sending.value = true
  error.value = ''
  try {
    const html = body.value
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`)
      .join('')
    await call('frappe.core.doctype.communication.email.make', {
      recipients: to.value,
      cc: cc.value,
      subject: subject.value || __('Zpráva'),
      content: html,
      doctype: 'CRM Lead',
      name: props.lead.name,
      send_email: 1,
      sender: getUser()?.email,
      sender_full_name: getUser()?.full_name || undefined,
    })
    toast.success(__('E-mail byl odeslán'))
    show.value = false
    emit('sent')
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    sending.value = false
  }
}
</script>
