<template>
  <!-- GrowUp (design 2. kolo, O2): schválení e-mailu – náhled, personalizace, kontroly, Schválit a odeslat (⌘↵), J / K -->
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="[{ label: __('Outreach'), route: { name: 'Outreach' } }, { label: __('Ke schválení'), route: { name: 'Outreach', params: { tab: 'approve' } } }]" />
    </template>
    <template #right-header>
      <span v-if="m" class="num mr-1 text-[14px] text-ink-gray-5">{{ position }}</span>
      <button class="gl-round flex size-11 items-center justify-center rounded-full" :disabled="!prevName" :aria-label="__('Předchozí')" @click="go(prevName)"><GlIcon name="left" :size="18" /></button>
      <button class="gl-round flex size-11 items-center justify-center rounded-full" :disabled="!nextName" :aria-label="__('Další')" @click="go(nextName)"><GlIcon name="right" :size="18" /></button>
    </template>
  </LayoutHeader>

  <div v-if="msg.error" class="px-4 py-10 text-center text-ink-gray-5">{{ msg.error.messages?.[0] || __('Zprávu se nepodařilo načíst.') }}</div>
  <div v-else-if="m" class="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-24 md:px-2 md:pb-2">
    <div class="grid min-h-0 gap-4 lg:grid-cols-[1fr_340px]">
      <div class="gl-card p-5 md:p-7">
        <dl class="text-[15px]">
          <div class="flex items-center gap-4 border-b border-[rgba(110,120,200,.14)] py-3"><dt class="w-16 shrink-0 text-ink-gray-5">{{ __('Od') }}</dt><dd class="min-w-0 truncate text-ink-gray-9">{{ m.from }}</dd></div>
          <div class="flex items-center gap-4 border-b border-[rgba(110,120,200,.14)] py-3">
            <dt class="w-16 shrink-0 text-ink-gray-5">{{ __('Komu') }}</dt>
            <dd class="flex min-w-0 items-center gap-2">
              <span class="flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-3 text-[14px] font-medium text-ink-gray-9"><span class="flex size-6 items-center justify-center rounded-full text-[10px] font-bold" :style="avatarTone(m.contact_name)">{{ initials(m.contact_name) }}</span>{{ m.contact_name }}</span>
              <span class="truncate text-[13px] text-ink-gray-5">{{ m.email }}</span>
            </dd>
          </div>
          <div class="flex items-center gap-4 border-b border-[rgba(110,120,200,.14)] py-3"><dt class="w-16 shrink-0 text-ink-gray-5">{{ __('Předmět') }}</dt><dd class="min-w-0 flex-1"><input v-model="subject" class="w-full border-0 bg-transparent text-[16px] font-semibold text-ink-gray-9 outline-none" :aria-label="__('Předmět')" @input="dirty = true" /></dd></div>
        </dl>
        <div
          ref="editor"
          contenteditable="true"
          lang="cs"
          role="textbox"
          :aria-label="__('Text e-mailu')"
          class="gl-text mt-5 min-h-[220px] whitespace-pre-wrap text-[16px] leading-relaxed text-ink-gray-9 outline-none [&_mark]:rounded-md [&_mark]:bg-[rgba(79,70,229,.14)] [&_mark]:px-1 [&_mark]:text-[#3b32c4]"
          @input="onInput"
        />
        <div class="mt-5 flex items-center gap-2.5 rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3 text-[13px] text-ink-gray-7">
          <GlIcon name="lock" :size="15" class="shrink-0 text-ink-gray-5" /><span>{{ m.footer }}</span>
        </div>
        <p v-if="m.unresolved.length" class="mt-3 text-[13px] font-semibold text-[#c8321f]">{{ unresolvedLabel }}</p>
      </div>

      <div class="flex flex-col gap-4">
        <div class="gl-card p-5">
          <div class="flex items-center gap-3">
            <span class="flex size-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold" :style="avatarTone(m.contact_name)">{{ initials(m.contact_name) }}</span>
            <div class="min-w-0"><div class="truncate text-[16px] font-bold text-ink-gray-9">{{ m.contact_name }}</div><div class="truncate text-[13px] text-ink-gray-5">{{ m.designation }}<template v-if="m.designation && m.organization"> · </template>{{ m.organization }}</div></div>
          </div>
          <dl class="mt-3 text-[14px]">
            <div class="flex justify-between gap-3 py-1"><dt class="text-ink-gray-5">{{ __('Kampaň') }}</dt><dd class="truncate font-medium text-ink-gray-9">{{ m.campaign_name }}</dd></div>
            <div class="flex justify-between gap-3 py-1"><dt class="text-ink-gray-5">{{ __('Krok') }}</dt><dd class="font-medium text-ink-gray-9">{{ m.step_index + 1 }} {{ __('ze') }} {{ m.steps_total }} · {{ __('e-mail') }}</dd></div>
            <div class="flex justify-between gap-3 py-1"><dt class="text-ink-gray-5">{{ __('Další krok') }}</dt><dd class="font-medium text-ink-gray-9">{{ m.next_step }}</dd></div>
          </dl>
        </div>
        <div class="gl-card p-5">
          <h3 class="flex items-center gap-2 text-[16px] font-bold text-ink-gray-9"><GlIcon name="sparkles" :size="16" class="text-[#6d3fd6]" />{{ __('Personalizace') }}</h3>
          <p class="mt-1 text-[13px] text-ink-gray-5">{{ __('Zvýrazněné proměnné doplňte nebo upravte přímo v textu e-mailu. Automatický výzkum webu (první věta) přibude později.') }}</p>
        </div>
        <div class="gl-card p-5">
          <h3 class="text-[16px] font-bold text-ink-gray-9">{{ __('Kontroly před odesláním') }}</h3>
          <ul class="mt-2 flex flex-col gap-1.5">
            <li v-for="c in m.checks" :key="c.label" class="flex items-start gap-2 text-[14px]" :class="c.ok ? 'text-ink-gray-9' : 'font-semibold text-[#c8321f]'">
              <GlIcon :name="c.ok ? 'check' : 'alert'" :size="16" class="mt-0.5 shrink-0" :class="c.ok ? 'text-[#15803d]' : ''" />{{ c.label }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>

  <!-- spodní lišta akcí -->
  <div v-if="m" class="gl-card fixed inset-x-3 bottom-3 z-30 flex items-center justify-between gap-3 !rounded-[22px] px-4 py-3 md:static md:mx-2 md:mb-2">
    <span class="hidden text-[13px] text-ink-gray-5 lg:block">{{ __('Upravte text přímo v e-mailu') }} · <kbd class="rounded bg-[rgba(110,120,200,.14)] px-1.5">⌘↵</kbd> {{ __('schválit') }} · <kbd class="rounded bg-[rgba(110,120,200,.14)] px-1.5">J</kbd> / <kbd class="rounded bg-[rgba(110,120,200,.14)] px-1.5">K</kbd> {{ __('další / předchozí') }}</span>
    <div class="ml-auto flex items-center gap-2">
      <button class="gl-quick !h-11 !px-4 !text-[15px]" @click="postpone"><GlIcon name="clock" :size="16" />{{ __('Odložit') }}</button>
      <button class="gl-quick !h-11 !px-4 !text-[15px]" @click="skip"><GlIcon name="skip" :size="16" />{{ __('Přeskočit') }}</button>
      <button class="inline-flex h-11 items-center gap-2 rounded-full bg-[#4F46E5] px-5 text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)] disabled:opacity-50" :disabled="sending || !canSend" :title="!canSend ? blockReason : ''" @click="approve">
        <GlIcon name="send" :size="16" />{{ __('Schválit a odeslat') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import { api, avatarTone, initials } from '@/composables/outreach'
import { sanitizeHTML } from '@/utils'
import { Breadcrumbs, createResource, toast } from 'frappe-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ name: { type: String, required: true } })
const router = useRouter()
const msg = createResource({ url: 'growupcrm.outreach.get_message', params: { name: props.name }, auto: true })
const m = computed(() => msg.data)
watch(() => props.name, (n) => msg.fetch({ name: n }))
const subject = ref('')
const body = ref('')
const editor = ref(null)
const dirty = ref(false)
const sending = ref(false)

const queue = computed(() => m.value?.queue || [])
const idx = computed(() => queue.value.indexOf(props.name))
const position = computed(() => (idx.value >= 0 ? `${idx.value + 1} ${__('z')} ${queue.value.length}` : ''))
const prevName = computed(() => (idx.value > 0 ? queue.value[idx.value - 1] : ''))
const nextName = computed(() => (idx.value >= 0 && idx.value < queue.value.length - 1 ? queue.value[idx.value + 1] : ''))
const unresolvedLabel = computed(() => __('Doplňte: {0}', [(m.value?.unresolved || []).map((v) => '{' + v + '}').join(', ')]))
const canSend = computed(() => m.value && m.value.checks.every((c) => c.ok) && !unresolved().length)
const blockReason = computed(() => (m.value?.checks.find((c) => !c.ok)?.label) || (unresolved().length ? __('Doplňte proměnné') : ''))

const unresolved = () => [...new Set([...subject.value.matchAll(/\{([a-z_]+)\}/g), ...body.value.matchAll(/\{([a-z_]+)\}/g)].map((x) => x[1]))]
// zvýraznění nevyřešených proměnných v textu e-mailu
const highlight = (html) => html.replace(/\{([a-z_]+)\}/g, '<mark>{$1}</mark>')
const clean = (html) => sanitizeHTML(html.replace(/<\/?mark[^>]*>/g, ''))

watch(m, async (d) => {
  if (!d) return
  subject.value = d.subject || ''
  body.value = d.body || ''
  dirty.value = false
  await nextTick()
  if (editor.value) editor.value.innerHTML = highlight(body.value)
}, { immediate: true })

function onInput() {
  body.value = clean(editor.value.innerHTML)
  dirty.value = true
}

async function persist() {
  if (dirty.value) {
    await api('save_message', { name: props.name, subject: subject.value, body: body.value })
    dirty.value = false
  }
}
async function go(name) {
  if (!name) return
  await persist()
  router.push({ name: 'OutreachReview', params: { name } })
}
async function after(removedAdvance = true) {
  // po vyřízení: další zpráva ve frontě, jinak zpět na přehled
  const rest = queue.value.filter((n) => n !== props.name)
  const next = nextName.value || rest[0]
  if (next) router.replace({ name: 'OutreachReview', params: { name: next } })
  else router.replace({ name: 'Outreach' })
}
async function approve() {
  if (!canSend.value || sending.value) return
  sending.value = true
  try {
    await api('approve', { name: props.name, subject: subject.value, body: body.value })
    toast.success(__('E-mail byl odeslán'))
    await after()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
    msg.reload()
  } finally {
    sending.value = false
  }
}
async function postpone() {
  await persist()
  await api('postpone', { name: props.name })
  await after()
}
async function skip() {
  await api('skip', { name: props.name })
  await after()
}

function onKey(e) {
  const typing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') return approve(), e.preventDefault()
  if (typing) return
  if (e.key === 'j') go(nextName.value)
  if (e.key === 'k') go(prevName.value)
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>
