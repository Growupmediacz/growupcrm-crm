<template>
  <!-- GrowUp (design 2. kolo, O6): editor šablony – typ kroku, název, předmět, text s proměnnými, živý náhled -->
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="[{ label: __('Outreach'), route: { name: 'Outreach' } }, { label: __('Šablony'), route: { name: 'Outreach', params: { tab: 'templates' } } }, { label: form.template_name || __('Nová šablona') }]" />
    </template>
    <template #right-header>
      <Button v-if="!isNew" variant="subtle" theme="red" iconLeft="trash-2" :label="__('Smazat')" @click="remove" />
      <Button :label="__('Zrušit')" @click="router.push({ name: 'Outreach', params: { tab: 'templates' } })" />
      <Button variant="solid" :loading="saving" :label="__('Uložit šablonu')" @click="save" />
    </template>
  </LayoutHeader>
  <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto px-3 pb-6 md:px-2 lg:grid-cols-[1fr_340px]">
    <div class="gl-card flex flex-col gap-4 p-5 md:p-7">
      <div>
        <span class="gl-label">{{ __('Typ kroku') }}</span>
        <div class="gl-seg flex w-full max-w-[420px]">
          <button v-for="t in TYPES" :key="t" class="gl-seg-btn flex-1 justify-center" :class="form.step_type === t && 'gl-seg-on'" @click="form.step_type = t">{{ t === 'LinkedIn' ? __('LinkedIn úkol') : t }}</button>
        </div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2">
        <label><span class="gl-label">{{ __('Název šablony') }}</span><input v-model="form.template_name" class="gl-field w-full" /></label>
        <label>
          <span class="gl-label">{{ __('Kategorie') }}</span>
          <select v-model="form.category" class="gl-field w-full"><option value="">{{ __('Bez kategorie') }}</option><option v-for="c in CATS" :key="c" :value="c">{{ c }}</option></select>
        </label>
      </div>
      <label v-if="form.step_type === 'E-mail'"><span class="gl-label">{{ __('Předmět') }}</span><input ref="subjectEl" v-model="form.subject" class="gl-field w-full" @focus="target = 'subject'" /></label>
      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <span class="gl-label !mb-0">{{ __('Text') }}</span>
          <Dropdown :options="varOptions" placement="right">
            <button class="inline-flex h-8 items-center gap-1.5 rounded-full bg-white/80 px-3 text-[13px] font-semibold text-ink-gray-9 shadow-[0_1px_6px_-2px_rgba(64,72,160,.25)]"><GlIcon name="hash" :size="14" />{{ __('Vložit proměnnou') }}</button>
          </Dropdown>
        </div>
        <div class="mb-1 flex gap-1 rounded-t-xl bg-[rgba(110,120,200,.1)] p-1.5">
          <button class="size-8 rounded-lg font-bold hover:bg-white/70" :aria-label="__('Tučně')" @mousedown.prevent="fmt('bold')">B</button>
          <button class="size-8 rounded-lg italic hover:bg-white/70" :aria-label="__('Kurzíva')" @mousedown.prevent="fmt('italic')">I</button>
          <button class="size-8 rounded-lg hover:bg-white/70" :aria-label="__('Odkaz')" @mousedown.prevent="link"><GlIcon name="link" :size="15" /></button>
        </div>
        <div ref="editor" contenteditable="true" lang="cs" role="textbox" :aria-label="__('Text šablony')" class="gl-field gl-text !h-auto min-h-[260px] whitespace-pre-wrap !rounded-t-none py-3 leading-relaxed outline-none [&_u]:no-underline" @input="onInput" @focus="target = 'body'" />
      </div>
      <div class="flex items-center gap-2.5 rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3 text-[13px] text-ink-gray-7"><GlIcon name="lock" :size="15" class="shrink-0 text-ink-gray-5" />{{ __('Odkaz na odhlášení a adresu sídla přidáme do patičky vždy automaticky.') }}</div>
      <ErrorMessage :message="error" />
    </div>

    <div class="flex flex-col gap-4">
      <div class="gl-card p-5">
        <div class="mb-3 flex items-center justify-between gap-2"><h3 class="text-[16px] font-bold text-ink-gray-9">{{ __('Náhled') }}</h3>
          <select v-model="previewContact" class="gl-field !h-9 min-w-0 flex-1 !text-[14px]" @change="refreshPreview">
            <option value="">{{ __('Vzorový kontakt') }}</option><option v-for="c in contacts.data || []" :key="c.name" :value="c.name">{{ c.full_name }}</option>
          </select>
        </div>
        <div class="rounded-2xl bg-[rgba(110,120,200,.1)] p-4">
          <div v-if="form.step_type === 'E-mail'" class="mb-2 text-[15px] font-bold text-ink-gray-9">{{ preview.subject }}</div>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div lang="cs" class="gl-text text-[14px] leading-relaxed text-ink-gray-7 [&_mark]:rounded [&_mark]:bg-[rgba(79,70,229,.14)] [&_mark]:px-0.5" v-html="previewHtml" />
        </div>
      </div>
      <div class="gl-card p-5">
        <h3 class="mb-2 text-[16px] font-bold text-ink-gray-9">{{ __('Proměnné') }}</h3>
        <div v-for="v in VARS" :key="v.key" class="flex items-center justify-between gap-3 py-1.5 text-[13px]">
          <button class="rounded-md bg-[rgba(79,70,229,.1)] px-1.5 font-mono font-semibold text-[#4338ca]" @click="insert(v.key)">{{ '{' + v.key + '}' }}</button>
          <span class="truncate text-ink-gray-5">{{ preview.variables?.[v.key] || v.hint }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { saveFailed } from '@/composables/glToast'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import { api } from '@/composables/outreach'
import { sanitizeHTML } from '@/utils'
import { Breadcrumbs, Button, Dropdown, ErrorMessage, createResource, toast } from 'frappe-ui'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ name: { type: String, required: true } })
const router = useRouter()
const isNew = computed(() => props.name === 'new')
const TYPES = ['E-mail', 'Hovor', 'LinkedIn']
const CATS = ['Úvodní e-maily', 'Follow-up', 'Hovory', 'LinkedIn']
const VARS = [
  { key: 'jmeno', hint: 'Tomáš' }, { key: 'osloveni', hint: 'pane Webere' }, { key: 'firma', hint: 'Stavby Novák' },
  { key: 'prvni_veta', hint: __('z výzkumu webu') }, { key: 'podpis', hint: __('z nastavení schránky') },
]
const form = reactive({ template_name: '', step_type: 'E-mail', category: '', subject: '', body: '' })
const editor = ref(null)
const target = ref('body')
const saving = ref(false)
const error = ref('')
const preview = ref({ subject: '', body: '', variables: {} })
const previewContact = ref('')
const contacts = createResource({ url: 'growupcrm.contacts.get_directory', params: { limit: 30 }, auto: true })

async function load() {
  if (isNew.value) return setBody('')
  const t = await api('get_template', { name: props.name })
  Object.assign(form, t)
  setBody(t.body || '')
  refreshPreview()
}
function setBody(html) {
  nextTick(() => editor.value && (editor.value.innerHTML = chips(html)))
}
load()

// proměnné v textu jako indigové čipy (design systém 2. kola); do uložené šablony jdou jako čistý text {proměnná}
const chips = (html) => (html || '').replace(/\{([a-z_]+)\}/g, '<mark>{$1}</mark>')
const onInput = () => (form.body = sanitizeHTML(editor.value.innerHTML.replace(/<\/?mark[^>]*>/g, '')))
const fmt = (cmd) => document.execCommand(cmd) && onInput()
function link() {
  const url = window.prompt(__('Adresa odkazu'))
  if (url && /^https?:\/\//.test(url)) document.execCommand('createLink', false, url), onInput()
}
function insert(key) {
  const token = `{${key}}`
  if (target.value === 'subject') form.subject = `${form.subject || ''}${token}`
  else {
    editor.value.focus()
    document.execCommand('insertHTML', false, `<mark>${token}</mark>&nbsp;`)
    onInput()
  }
}
const varOptions = computed(() => VARS.map((v) => ({ label: `{${v.key}}`, onClick: () => insert(v.key) })))

let timer
async function refreshPreview() {
  clearTimeout(timer)
  timer = setTimeout(async () => {
    preview.value = await api('preview_template', { subject: form.subject || '', body: form.body || '', contact: previewContact.value || undefined })
  }, 250)
}
watch(() => [form.subject, form.body], refreshPreview)
// nevyřešené proměnné (např. {prvni_veta}) v náhledu zvýraznit
const previewHtml = computed(() => sanitizeHTML((preview.value.body || '').replace(/\{([a-z_]+)\}/g, '<mark>{$1}</mark>')))

async function save() {
  error.value = ''
  saving.value = true
  try {
    const n = await api('save_template', { ...form, name: isNew.value ? undefined : props.name })
    toast.success(__('Šablona je uložená'))
    if (isNew.value) router.replace({ name: 'OutreachTemplate', params: { name: n } })
  } catch (e) {
    error.value = e.messages?.[0] || e.message
    saveFailed(e, save)
  } finally {
    saving.value = false
  }
}
async function remove() {
  if (!window.confirm(__('Smazat šablonu?'))) return
  try {
    await api('delete_template', { name: props.name })
    router.replace({ name: 'Outreach', params: { tab: 'templates' } })
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
</script>
