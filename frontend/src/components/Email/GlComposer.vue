<template>
  <!-- GrowUp (zadání 2027 E1): jediný editor e-mailu v CRM (odpověď pod vláknem, nová zpráva, Odpovědi kampaní,
       úprava návrhu agenta, spodní panel na telefonu). TipTap přes frappe-ui Editor jako EmailEditor.vue,
       česky, s podpisem, šablonami (tlačítko nebo „/“), přílohami, automatickým konceptem, ⌘↵ a „Vrátit zpět“. -->
  <component :is="mode === 'inline' ? 'div' : Teleport" v-bind="mode === 'inline' ? {} : { to: 'body' }">
    <div v-if="mode === 'sheet'" class="gl-cmp-scrim" aria-hidden="true" @click="close" />
    <div
      ref="root"
      class="gl-cmp"
      :class="`is-${mode}`"
      :role="mode === 'inline' ? 'group' : 'dialog'"
      :aria-modal="mode === 'inline' ? undefined : 'true'"
      :aria-label="title || __('Napsat e-mail')"
      @keydown.capture="onKeydown"
    >
      <!-- E2: stažením úchytu nebo hlavičky dolů se panel zavře a koncept uloží -->
      <div v-if="mode === 'sheet'" class="gl-cmp-grab-area" aria-hidden="true" v-on="sheetDrag.handlers"><div class="gl-cmp-grab" /></div>
      <div v-if="mode !== 'inline' || title" class="gl-cmp-hd" v-on="mode === 'sheet' ? sheetDrag.handlers : {}">
        <button v-if="mode !== 'inline'" type="button" class="gl-cmp-icon" :aria-label="__('Zavřít a uložit koncept')" @click="close">
          <GlIcon name="x" :size="20" />
        </button>
        <b class="min-w-0 flex-1 truncate text-[16px] font-[650] text-ink-gray-9">{{ title || __('Nová zpráva') }}</b>
        <span class="text-[13px] text-[color:var(--text-2)]" aria-live="polite">{{ savedLabel }}</span>
      </div>
      <slot name="top" />

      <!-- Komu, Kopie, Skrytá, Předmět -->
      <div class="gl-cmp-row">
        <label class="gl-cmp-lbl" :for="uid + '-to'">{{ __('Komu') }}</label>
        <MultiSelectEmailInput
          :id="uid + '-to'"
          v-model="draft.to"
          class="min-w-0 flex-1"
          variant="ghost"
          :validate="validateEmail"
          :error-message="(v) => __('{0} není platná e-mailová adresa', [v])"
        />
        <span class="gl-cmp-links">
          <button v-if="!showCc" type="button" class="gl-cmp-link" @click="reveal('cc')">{{ __('Kopie') }}</button>
          <button v-if="!showBcc" type="button" class="gl-cmp-link" @click="reveal('bcc')">{{ __('Skrytá') }}</button>
          <button v-if="!subjectOpen" type="button" class="gl-cmp-link" @click="reveal('subject')">{{ __('Předmět') }}</button>
        </span>
      </div>
      <div v-if="showCc" class="gl-cmp-row">
        <span class="gl-cmp-lbl">{{ __('Kopie') }}</span>
        <MultiSelectEmailInput ref="ccInput" v-model="draft.cc" class="min-w-0 flex-1" variant="ghost" :validate="validateEmail" :error-message="(v) => __('{0} není platná e-mailová adresa', [v])" />
      </div>
      <div v-if="showBcc" class="gl-cmp-row">
        <span class="gl-cmp-lbl">{{ __('Skrytá') }}</span>
        <MultiSelectEmailInput ref="bccInput" v-model="draft.bcc" class="min-w-0 flex-1" variant="ghost" :validate="validateEmail" :error-message="(v) => __('{0} není platná e-mailová adresa', [v])" />
      </div>
      <div v-if="subjectOpen" class="gl-cmp-row">
        <label class="gl-cmp-lbl" :for="uid + '-subj'">{{ __('Předmět') }}</label>
        <input :id="uid + '-subj'" ref="subjectInput" v-model="draft.subject" class="gl-cmp-subject" :placeholder="__('Předmět e-mailu')" />
      </div>

      <Editor
        ref="ed"
        class="gl-cmp-ed"
        v-model="draft.html"
        :extensions="extensions"
        :placeholder="placeholder || __('Napište zprávu… (šablona: /)')"
        :editable="true"
        :upload-function="(file) => uploadFile(file, draftKey.reference_doctype, draftKey.reference_name)"
      >
        <div class="gl-cmp-body">
          <EditorContent class="gl-cmp-text prose-f max-w-none" lang="cs" />
        </div>
        <div v-if="draft.attachments.length" class="flex flex-wrap gap-2 px-4 pb-2">
          <span v-for="a in draft.attachments" :key="a.name || a.file_url" class="gl-cmp-att">
            <GlIcon name="doc" :size="15" /><span class="truncate">{{ a.file_name }}</span>
            <button type="button" class="gl-cmp-att-x" :aria-label="__('Odebrat přílohu {0}', [a.file_name])" @click="removeAttachment(a)"><GlIcon name="x" :size="14" /></button>
          </span>
        </div>
        <p v-if="placeholders" class="gl-cmp-warn" role="alert">
          <GlIcon name="alert" :size="16" />{{ placeholders === 1 ? __('1 místo k doplnění (zvýrazněné „DOPLNIT…“)') : __('{0} míst k doplnění („DOPLNIT…“)', [placeholders]) }}
        </p>
        <p v-if="error" class="gl-cmp-warn is-err" role="alert">
          <GlIcon name="alert" :size="16" />{{ __('Neodesláno: {0}', [error]) }}
          <button type="button" class="gl-cmp-link !min-h-[36px] underline" @click="send">{{ __('Zkusit znovu') }}</button>
        </p>
        <p v-if="note" class="px-4 pb-2 text-[13px] text-[color:var(--text-2)]">{{ note }}</p>
        <div class="gl-cmp-bar">
          <div class="gl-cmp-tools">
            <FileUploader
              v-if="draftKey.reference_name"
              :upload-args="{ doctype: draftKey.reference_doctype, docname: draftKey.reference_name, private: true }"
              @success="addAttachment"
            >
              <template #default="{ openFileSelector }">
                <button type="button" class="gl-cmp-icon" :aria-label="__('Přiložit soubor')" :title="__('Přiložit soubor')" @click="openFileSelector()"><GlIcon name="link" :size="18" /></button>
              </template>
            </FileUploader>
            <button type="button" class="gl-cmp-icon" :aria-label="__('Vložit šablonu')" :title="__('Šablona ( / )')" @click="showTemplates = true"><GlIcon name="doc" :size="18" /></button>
            <EditorFixedMenu class="gl-cmp-fmt" :items="commentToolbar" />
            <Dropdown :options="delayOptions" placement="left">
              <button type="button" class="gl-cmp-icon" :aria-label="__('Vrátit zpět po odeslání: {0}', [delayLabel])" :title="__('Vrátit zpět po odeslání: {0}', [delayLabel])"><GlIcon name="clock" :size="18" /></button>
            </Dropdown>
          </div>
          <span v-if="mode === 'inline'" class="hidden text-[13px] text-[color:var(--text-2)] sm:inline" aria-live="polite">{{ savedLabel }}</span>
          <button type="button" class="gl-cmp-ghost" @click="discardDraft">{{ __('Zahodit') }}</button>
          <button type="button" class="gl-cmp-send" :disabled="sending" @click="send">
            <GlIcon name="send" :size="17" />
            <span>{{ sending ? __('Odesílám…') : placeholders ? __('Doplnit a odeslat') : __('Odeslat') }}</span>
            <kbd class="gl-cmp-kbd">{{ submitShortcutLabel }}</kbd>
          </button>
        </div>
      </Editor>
    </div>
  </component>
  <EmailTemplateSelectorModal v-if="showTemplates" v-model="showTemplates" :doctype="draftKey.reference_doctype || 'CRM Lead'" @apply="applyTemplate" />
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import MultiSelectEmailInput from '@/components/Controls/MultiSelectEmailInput.vue'
import EmailTemplateSelectorModal from '@/components/Modals/EmailTemplateSelectorModal.vue'
import { commentToolbar, uploadFile } from '@/components/editor/config'
import { useDraft, hasUserText } from '@/composables/glDraft'
import { useSheetDrag } from '@/composables/glSheetDrag'
import { sendWithUndo } from '@/composables/glUndoSend'
import { countPlaceholders, htmlText, loadMailSettings, mailSettings, quoteBlock, restoredDraft, setUndoSeconds, signatureHtml } from '@/composables/glMail'
import { validateEmail, submitShortcutLabel } from '@/utils'
import { Dropdown, FileUploader, call, toast } from 'frappe-ui'
import { Editor, EditorContent, EditorFixedMenu, RichTextKit } from 'frappe-ui/editor'
import { Teleport, computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  // {reference_doctype, reference_name, thread_id, local_id}; bez reference_name se koncept drží jen v prohlížeči
  draftKey: { type: Object, required: true },
  // výchozí hodnoty nového konceptu: {to, cc, subject, in_reply_to, html}
  defaults: { type: Object, default: () => ({}) },
  quote: { type: Object, default: null }, // zpráva, jejíž citace se připojí při odeslání
  doc: { type: Object, default: null }, // záznam pro vyplnění šablony (zakázka)
  mode: { type: String, default: 'inline' }, // inline | panel | sheet
  title: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  note: { type: String, default: '' },
  outreachReply: { type: String, default: '' },
  autofocus: { type: Boolean, default: true },
})
const emit = defineEmits(['sent', 'close'])

const uid = 'cmp' + Math.random().toString(36).slice(2, 7)
const root = ref(null)
const sheetDrag = useSheetDrag(root, () => close())
const ed = ref(null)
const subjectInput = ref(null)
const ccInput = ref(null)
const bccInput = ref(null)
const editor = computed(() => ed.value?.editor)
// „/“ v editoru otevírá šablony e-mailů (vestavěné příkazy TipTapu jsou anglicky a do e-mailu nepatří)
const extensions = [RichTextKit.configure({ heading: { levels: [2, 3] }, slashCommands: false })]

const { draft, savedAt, load, save, discard, forgetLocal, snapshot } = useDraft(() => props.draftKey)
const ready = ref(false)
const showCc = ref(false)
const showBcc = ref(false)
const subjectOpen = ref(false)
const showTemplates = ref(false)
const sending = ref(false)
const error = ref('')
let hadDraft = false
let done = false // po odeslání se koncept už neukládá
let lastFocus = null

const placeholders = computed(() => countPlaceholders(draft.html))
const savedLabel = computed(() => {
  if (!savedAt.value || !hasUserText(draft, mailSettings.data?.signature)) return ''
  const d = savedAt.value
  return __('koncept uložen {0}', [`${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`])
})

const DELAYS = [0, 5, 10, 20, 30]
const delayLabel = computed(() => {
  const s = Number(mailSettings.data?.undo_seconds ?? 10)
  return s ? __('{0} s', [s]) : __('vypnuto')
})
const delayOptions = computed(() => [
  {
    group: __('Vrátit zpět po odeslání'),
    items: DELAYS.map((s) => ({
      label: (s ? __('{0} s', [s]) : __('Vypnuto')) + (Number(mailSettings.data?.undo_seconds ?? 10) === s ? ' ✓' : ''),
      onClick: () => setUndoSeconds(s).then(() => toast.success(s ? __('Odeslání půjde {0} s vrátit', [s]) : __('Vrácení odeslání je vypnuté'))),
    })),
  },
])

async function init() {
  ready.value = false
  const settings = await loadMailSettings()
  hadDraft = await load({
    to: props.defaults.to || [],
    cc: props.defaults.cc || [],
    subject: props.defaults.subject || '',
    in_reply_to: props.defaults.in_reply_to || '',
    html: props.defaults.html || '',
  })
  if (!hadDraft && props.defaults.html) draft.signature_added = true // návrh agenta už podpis má
  if (!draft.signature_added && settings.signature) {
    draft.html = `<p></p>${signatureHtml(settings.signature)}` + (draft.html || '')
    draft.signature_added = true
  }
  showCc.value = draft.cc.length > 0
  showBcc.value = draft.bcc.length > 0
  subjectOpen.value = !props.defaults.in_reply_to || !draft.subject
  await nextTick()
  ready.value = true
  if (props.autofocus) {
    await nextTick()
    if (!draft.to.length) root.value?.querySelector('input')?.focus()
    else editor.value?.commands.focus('start')
  }
}

watch(
  () => [props.draftKey.reference_name, props.draftKey.thread_id, props.draftKey.local_id].join('|'),
  () => init(),
)
// po „Vrátit zpět“ načíst obnovený koncept
watch(restoredDraft, (r) => {
  if (r && r.key.reference_name === props.draftKey.reference_name && (r.key.thread_id || '') === (props.draftKey.thread_id || '')) init()
})

// automatický koncept: ukládá se jen to, co uživatel opravdu napsal
watch(
  () => [draft.html, draft.subject, draft.to.join(), draft.cc.join(), draft.bcc.join(), draft.attachments.length],
  () => {
    if (!ready.value || sending.value || done) return
    if (hasUserText(draft, mailSettings.data?.signature)) {
      save()
      hadDraft = true
    } else if (hadDraft) {
      discard(true) // uložený koncept pryč, rozepsaná pole zůstávají
      hadDraft = false
    }
  },
)

function reveal(which) {
  if (which === 'cc') (showCc.value = true), nextTick(() => ccInput.value?.setFocus?.())
  if (which === 'bcc') (showBcc.value = true), nextTick(() => bccInput.value?.setFocus?.())
  if (which === 'subject') (subjectOpen.value = true), nextTick(() => subjectInput.value?.focus())
}

function addAttachment(file) {
  draft.attachments.push({ name: file.name, file_name: file.file_name, file_url: file.file_url })
}
function removeAttachment(a) {
  draft.attachments = draft.attachments.filter((x) => x !== a)
}

async function applyTemplate(t) {
  showTemplates.value = false
  try {
    const doc = props.doc || {}
    const r = await call('frappe.email.doctype.email_template.email_template.get_email_template', { template_name: t.name, doc: { ...doc, doc } })
    if (r.subject && (!draft.subject || !props.defaults.in_reply_to)) draft.subject = r.subject
    const body = r.message || ''
    if (!hasUserText({ html: draft.html }, mailSettings.data?.signature)) {
      draft.html = body + signatureHtml(mailSettings.data?.signature)
      await nextTick()
      editor.value?.commands.setContent(draft.html)
    } else {
      editor.value?.chain().focus().insertContent(body).run()
    }
    editor.value?.commands.focus()
  } catch (e) {
    toast.error(e?.messages?.[0] || __('Šablonu se nepodařilo načíst'))
  }
}

function onKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    send()
  } else if (e.key === 'Escape' && !showTemplates.value) {
    e.stopPropagation()
    close()
  } else if (e.key === '/' && !e.metaKey && !e.ctrlKey && e.target?.closest?.('.ProseMirror')) {
    // „/“ na začátku prázdného řádku otevře šablony
    const node = window.getSelection()?.anchorNode
    const block = node && (node.nodeType === 1 ? node : node.parentElement)?.closest('p, li, h2, h3')
    if (block && !block.textContent.trim()) {
      e.preventDefault()
      e.stopPropagation()
      // dialog až po uvolnění klávesy, jinak ho editor hned zavře (fokus zpět do textu)
      e.target.blur()
      setTimeout(() => (showTemplates.value = true), 50)
    }
  }
}

async function send() {
  if (sending.value) return
  error.value = ''
  if (!draft.to.length) {
    error.value = __('Doplňte, komu e-mail posíláte')
    root.value?.querySelector('input')?.focus()
    return
  }
  if (placeholders.value) {
    toast.error(__('Nejdřív doplňte zvýrazněné místo „DOPLNIT…“'))
    editor.value?.commands.focus()
    return
  }
  if (!htmlText(draft.html) && !draft.attachments.length) {
    error.value = __('E-mail je prázdný')
    return
  }
  sending.value = true
  forgetLocal() // zastaví odložené uložení konceptu, aby se po odeslání znovu nevytvořil
  const snap = snapshot()
  try {
    const result = await sendWithUndo(
      {
        reference_doctype: props.draftKey.reference_doctype,
        reference_name: props.draftKey.reference_name,
        thread_id: props.draftKey.thread_id || '',
        to: draft.to,
        cc: draft.cc,
        bcc: draft.bcc,
        subject: draft.subject,
        html: draft.html + quoteBlock(props.quote),
        attachments: draft.attachments.map((a) => a.name),
        in_reply_to: draft.in_reply_to || '',
        outreach_reply: props.outreachReply || '',
      },
      { draftKey: { ...props.draftKey }, snapshot: snap, recipientLabel: draft.to.join(', ') },
    )
    done = true
    forgetLocal()
    hadDraft = false
    emit('sent', { ...result, html: snap?.html ?? draft.html }) // zadání 2027 E3: odeslaný text pro učení agenta
  } catch (e) {
    error.value = e?.messages?.[0] || e?.message || __('zkuste to znovu')
    save() // neodeslaný text zůstane v konceptu
  } finally {
    sending.value = false
  }
}

async function discardDraft() {
  if (hasUserText(draft, mailSettings.data?.signature) && !window.confirm(__('Zahodit rozepsaný e-mail?'))) return
  await discard()
  hadDraft = false
  emit('close', { discarded: true })
}

function close() {
  if (!done && hasUserText(draft, mailSettings.data?.signature)) save()
  emit('close', { discarded: false })
}

onMounted(() => {
  lastFocus = document.activeElement
  init()
})
onBeforeUnmount(() => {
  if (ready.value && !sending.value && !done && hasUserText(draft, mailSettings.data?.signature)) save()
  if (props.mode !== 'inline' && lastFocus?.focus) lastFocus.focus()
})

defineExpose({ focus: () => editor.value?.commands.focus(), send })
</script>
<style scoped>
.gl-cmp {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid var(--field-border);
  border-radius: 20px;
  box-shadow: 0 6px 24px -12px rgba(64, 72, 160, 0.35);
}
.gl-cmp:focus-within { border-color: var(--accent-200); }
.gl-cmp.is-panel {
  position: fixed;
  z-index: 90;
  right: 24px;
  bottom: 24px;
  width: min(640px, calc(100vw - 48px));
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  border-radius: var(--r-panel);
  background: var(--mat-dialog);
  backdrop-filter: var(--mat-blur);
  box-shadow: var(--mat-sheet-shadow);
  animation: gl-cmp-in var(--t-panel) var(--ease-panel);
}
.gl-cmp.is-sheet {
  position: fixed;
  z-index: 95;
  left: 0;
  right: 0;
  bottom: 0;
  height: 92dvh;
  border-radius: 28px 28px 0 0;
  border: 0;
  background: var(--mat-dialog);
  backdrop-filter: var(--mat-blur);
  box-shadow: var(--mat-sheet-shadow);
  animation: gl-cmp-up var(--t-sheet) var(--ease-panel);
  overflow: hidden;
}
.gl-cmp.is-sheet .gl-cmp-ed { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.gl-cmp.is-sheet :deep(.gl-cmp-body) { flex: 1; overflow-y: auto; min-height: 0; }
.gl-cmp.is-sheet .gl-cmp-bar { padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
/* E2: čipy příjemců na telefonu jako cíl 44 px */
.gl-cmp.is-sheet :deep(.gl-cmp-row button) { min-height: 44px; }
.gl-cmp-scrim { position: fixed; inset: 0; z-index: 94; background: var(--scrim); animation: gl-fade var(--t-sheet) var(--ease-panel); }
@keyframes gl-cmp-in { from { opacity: 0; transform: translateX(24px); } }
@keyframes gl-cmp-up { from { transform: translateY(100%); } }
@keyframes gl-fade { from { opacity: 0; } }
.gl-cmp-grab-area { flex: none; padding: 8px 0 6px; touch-action: none; cursor: grab; }
.gl-cmp.is-sheet .gl-cmp-hd { touch-action: none; }
.gl-cmp-grab { width: 40px; height: 5px; border-radius: 3px; background: var(--text-2); opacity: 0.4; margin: 0 auto; }
.gl-cmp-hd { display: flex; align-items: center; gap: 8px; padding: 6px 12px 6px 6px; border-bottom: 1px solid var(--line); flex: none; }
.gl-cmp-row :deep(input.search-input) { min-width: 80px; background: transparent; font-size: 15px; }
.gl-cmp-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit);
  padding: 6px 12px 6px 16px;
  border-bottom: 1px solid var(--line);
  font-size: 15px;
  flex: none;
}
.gl-cmp-lbl { flex: none; width: 56px; color: var(--text-2); font-size: 14px; }
.gl-cmp-links { display: flex; flex: none; gap: 2px; }
.gl-cmp-link {
  min-height: var(--hit-sm);
  padding: 0 8px;
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-2);
}
.gl-cmp-link:hover { color: var(--text-1); background: var(--state-them-bg); }
.gl-cmp-subject { flex: 1; min-width: 0; border: 0; background: transparent; font-size: 15px; font-weight: 600; color: var(--text-1); padding: 8px 0; }
.gl-cmp-subject:focus { outline: none; box-shadow: none; }
.gl-cmp-body { display: flex; flex-direction: column; }
.gl-cmp-body :deep(.ProseMirror) {
  min-height: 180px;
  padding: 14px 16px;
  font-size: var(--read-size);
  line-height: 1.55;
  color: var(--text-1);
  max-width: calc(var(--read-w) + 32px);
  outline: none;
  word-break: normal;
  overflow-wrap: break-word;
}
@media (max-width: 767px) {
  .gl-cmp-body :deep(.ProseMirror) { font-size: 17px; min-height: 220px; }
}
.gl-cmp-body :deep(.ProseMirror p) { margin: 0 0 0.6em; }
.gl-cmp-att {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: var(--hit-sm);
  padding: 0 4px 0 12px;
  border-radius: 12px;
  border: 1px solid var(--field-border);
  font-size: 14px;
  font-weight: 500;
}
.gl-cmp-att-x { display: inline-flex; width: var(--hit-sm); height: var(--hit-sm); align-items: center; justify-content: center; border-radius: 10px; color: var(--text-2); }
.gl-cmp-att-x:hover { background: var(--state-them-bg); color: var(--text-1); }
.gl-cmp-warn { display: flex; align-items: center; gap: 8px; margin: 0 16px 8px; padding: 8px 12px; border-radius: 12px; font-size: 14px; color: var(--warn-fg); background: var(--warn-bg); }
.gl-cmp-warn.is-err { flex-wrap: wrap; }
.gl-cmp-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-top: 1px solid var(--line);
  flex: none;
  flex-wrap: wrap;
  background: inherit;
  border-radius: 0 0 20px 20px;
}
.gl-cmp-tools { display: flex; align-items: center; gap: 2px; margin-right: auto; flex-wrap: wrap; }
.gl-cmp-fmt :deep(button) { min-width: var(--hit-sm); min-height: var(--hit-sm); }
.gl-cmp-icon {
  display: inline-flex;
  width: var(--hit);
  height: var(--hit);
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  color: var(--text-2);
}
.gl-cmp-icon:hover { background: var(--state-them-bg); color: var(--text-1); }
.gl-cmp-ghost {
  min-height: var(--hit);
  padding: 0 14px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-2);
}
.gl-cmp-ghost:hover { background: var(--state-them-bg); color: var(--text-1); }
.gl-cmp-send {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit);
  padding: 0 18px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  color: white;
  background: var(--accent-600);
  box-shadow: 0 8px 20px -8px color-mix(in srgb, var(--accent-600) 70%, transparent);
  transition: transform var(--t-press);
}
.gl-cmp-send:active { transform: scale(0.97); }
.gl-cmp-send:disabled { opacity: 0.6; }
.gl-cmp-kbd { border-radius: 6px; background: rgba(255, 255, 255, 0.2); padding: 0 6px; font-size: 13px; font-weight: 500; }
@media (max-width: 767px) { .gl-cmp-kbd { display: none; } }
.gl-cmp-icon:focus-visible, .gl-cmp-ghost:focus-visible, .gl-cmp-send:focus-visible, .gl-cmp-link:focus-visible, .gl-cmp-att-x:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
<style scoped>
/* telefon (návrh b): Komu přes celou šířku, odkazy Kopie/Skrytá/Předmět pod ním, jedna lišta nástrojů */
@media (max-width: 767px) {
  .gl-cmp-row { flex-wrap: wrap; }
  .gl-cmp-row > :deep(.min-w-0.flex-1) { flex-basis: calc(100% - 64px); }
  .gl-cmp-links { width: 100%; justify-content: flex-end; }
  .gl-cmp-fmt { display: none; }
  .gl-cmp-bar { flex-wrap: nowrap; }
}
.gl-cmp.is-inline .gl-cmp-hd { padding-left: 16px; }
</style>
