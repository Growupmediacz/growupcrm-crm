<template>
  <!-- GrowUp (zadání 2027 E1, varianta A): konverzace zakázky – seznam vláken (280 px) · vlákno · (zakázka = LeadAside).
       „Soustředit“ (F) sbalí seznam i pravý sloupec; vlákno roste do plné výšky, posouvá se celý sloupec. -->
  <div class="gl-conv" :class="focused && 'is-focus'">
    <aside class="gl-conv-list" :aria-hidden="focused ? 'true' : undefined" :inert="focused || undefined">
      <button type="button" class="gl-conv-new" @click="openNew"><GlIcon name="plus" :size="17" />{{ __('Nová zpráva') }}</button>
      <GlThreadList :threads="threadsWithMarks" :selected="selectedId" :loading="threads.loading" @select="select" />
    </aside>

    <div class="gl-conv-main">
      <div v-if="focused" class="gl-conv-focusbar">
        <button type="button" class="gl-conv-btn" @click="focused = false"><GlIcon name="left" :size="16" />{{ __('Zpět na tři sloupce') }} <kbd class="gl-conv-kbd">F</kbd></button>
        <span class="text-[13px] text-[color:var(--text-2)]">{{ __('vlákno {0} z {1}', [selIndex + 1, threadList.length]) }} · <kbd class="gl-conv-kbd">J</kbd> <kbd class="gl-conv-kbd">K</kbd> {{ __('další') }}</span>
      </div>

      <GlComposer
        v-if="composeNew"
        class="mb-6"
        :draftKey="{ reference_doctype: doctype, reference_name: docname, thread_id: '' }"
        :defaults="{ to: doc?.email ? [doc.email] : [] }"
        :doc="doc"
        :title="__('Nová zpráva')"
        @sent="afterSent"
        @close="composeNew = false"
      />

      <GlEmptyState
        v-if="!threads.loading && !threadList.length && !composeNew"
        icon="mail"
        :title="__('Zatím žádný e-mail')"
        :text="__('E-maily s touto zakázkou se objeví tady, každá konverzace zvlášť.')"
      >
        <button type="button" class="gl-conv-reply mt-3" @click="openNew"><GlIcon name="plus" :size="17" />{{ __('Napsat e-mail') }}</button>
      </GlEmptyState>

      <GlThread v-else-if="selectedId" ref="threadRef" :thread="thread.data" :loading="thread.loading" @reply="startReply">
        <template #head-actions>
          <button type="button" class="gl-conv-btn" :aria-pressed="focused" :title="__('Soustředit (F)')" @click="focused = !focused">
            <GlIcon name="sliders" :size="16" />{{ focused ? __('Tři sloupce') : __('Soustředit') }} <kbd class="gl-conv-kbd">F</kbd>
          </button>
        </template>
        <template #below>
          <GlAgentDraft
            v-if="proposal && !composer"
            :proposal="proposal"
            @edit="editProposal"
            @send="editProposal"
            @rejected="proposal = null"
          />
          <div v-if="composer" ref="composerWrap" class="mt-4">
            <GlComposer
              :draftKey="{ reference_doctype: doctype, reference_name: docname, thread_id: selectedId }"
              :defaults="composer.defaults"
              :quote="composer.quote"
              :doc="doc"
              :title="composer.title"
              :autofocus="composer.autofocus !== false"
              @sent="afterSent"
              @close="composer = null"
            />
          </div>
          <div v-else-if="thread.data" class="gl-conv-sticky">
            <button type="button" class="gl-conv-reply" @click="startReply({ mode: 'reply' })">
              <GlIcon name="reply" :size="18" />{{ hasDraft ? __('Pokračovat v konceptu') : __('Odpovědět') }} <kbd class="gl-conv-kbd is-dark">R</kbd>
            </button>
          </div>
        </template>
      </GlThread>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlThreadList from '@/components/Email/GlThreadList.vue'
import GlThread from '@/components/Email/GlThread.vue'
import GlComposer from '@/components/Email/GlComposer.vue'
import GlAgentDraft from '@/components/Agent/GlAgentDraft.vue'
import { replyDraft, restoredDraft } from '@/composables/glMail'
import { decideAfterUndo, proposalForThread } from '@/composables/glAgentProposals'
import { createResource } from 'frappe-ui'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  doctype: { type: String, default: 'CRM Lead' },
  docname: { type: String, required: true },
  doc: { type: Object, default: null },
})
const focused = defineModel('focused', { type: Boolean, default: false })
const route = useRoute()
const router = useRouter()

const threadRef = ref(null)
const composerWrap = ref(null)
const composeNew = ref(false)
const composer = ref(null) // {defaults, quote, title}
const proposal = ref(null)

const threads = createResource({
  url: 'growupcrm.mail_threads.list_threads',
  params: { reference_doctype: props.doctype, reference_name: props.docname },
  cache: ['gl-threads', props.docname],
  auto: true,
})
const threadList = computed(() => threads.data?.threads || [])
const threadsWithMarks = computed(() => threadList.value.map((t) => ({ ...t, has_proposal: proposal.value && t.id === selectedId.value })))

const selectedId = computed(() => {
  const q = route.query.vlakno
  if (q && threadList.value.some((t) => t.id === q)) return q
  return threadList.value[0]?.id || ''
})
const selIndex = computed(() => Math.max(0, threadList.value.findIndex((t) => t.id === selectedId.value)))
const hasDraft = computed(() => threadList.value.find((t) => t.id === selectedId.value)?.has_draft)

const thread = createResource({ url: 'growupcrm.mail_threads.get_thread' })
watch(
  selectedId,
  async (id) => {
    composer.value = null
    proposal.value = null
    if (!id) return
    await thread.fetch({ reference_doctype: props.doctype, reference_name: props.docname, thread_id: id })
    proposal.value = await proposalForThread({ doctype: props.doctype, name: props.docname }, thread.data)
    if (threadList.value.find((t) => t.id === id)?.has_draft) startReply({ mode: 'reply', silent: true })
  },
  { immediate: true },
)
watch(
  () => threads.data?.new_draft,
  (v) => v && (composeNew.value = true),
)

function select(id) {
  router.replace({ query: { ...route.query, vlakno: id } })
}
function openNew() {
  composeNew.value = true
  focused.value = false
}

function startReply({ mode = 'reply', message = null, silent = false } = {}) {
  const r = replyDraft(thread.data, { mode, message })
  if (!r) return
  composer.value = { ...r, autofocus: !silent }
  if (!silent) nextTick(() => composerWrap.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}

function editProposal(p) {
  const msgs = thread.data?.messages || []
  const m = [...msgs].reverse().find((x) => x.sent_or_received === 'Received' && !x.automated)
  composer.value = {
    proposal: p,
    title: __('Návrh agenta – upravte a odešlete'),
    defaults: { to: p.to || [], subject: p.subject, in_reply_to: m?.name || '', html: p.html },
    quote: m || null,
  }
  nextTick(() => composerWrap.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
}

async function afterSent(result) {
  // zadání 2027 E3: odeslaný návrh agenta uzavřít a zapsat do učení (D2 proposals.decide)
  const p = composer.value?.proposal
  if (p) decideAfterUndo(p, result)
  composer.value = null
  composeNew.value = false
  proposal.value = null
  await threads.reload()
  if (selectedId.value) thread.fetch({ reference_doctype: props.doctype, reference_name: props.docname, thread_id: selectedId.value })
}

// po „Vrátit zpět“ otevřít editor s obnoveným textem
watch(restoredDraft, async (r) => {
  if (!r || r.key.reference_name !== props.docname) return
  await threads.reload()
  if (!r.key.thread_id) composeNew.value = true
  else {
    select(r.key.thread_id)
    await thread.fetch({ reference_doctype: props.doctype, reference_name: props.docname, thread_id: r.key.thread_id })
    startReply({ mode: 'reply' })
  }
})

// klávesy: F soustředit, R odpovědět, J/K další/předchozí vlákno, E upravit návrh, Esc zpět
function onKey(e) {
  const t = e.target
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (t?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
  const k = e.key.toLowerCase()
  if (k === 'f') (focused.value = !focused.value), e.preventDefault()
  else if (k === 'r' && thread.data) startReply({ mode: 'reply' }), e.preventDefault()
  else if (k === 'e' && proposal.value && !composer.value) editProposal(proposal.value), e.preventDefault()
  else if (k === 'j' || k === 'k') {
    const i = selIndex.value + (k === 'j' ? 1 : -1)
    if (threadList.value[i]) select(threadList.value[i].id)
    e.preventDefault()
  } else if (e.key === 'Escape' && focused.value) focused.value = false
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  focused.value = false
})

defineExpose({ openNew, reload: () => threads.reload() })
</script>
<style scoped>
.gl-conv {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
  padding: 16px 20px 24px;
  transition: grid-template-columns var(--t-panel) var(--ease-panel);
}
.gl-conv.is-focus { grid-template-columns: 0 minmax(0, 1fr); gap: 0; }
.gl-conv-list {
  position: sticky;
  top: 0;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  min-width: 0;
  transition: opacity var(--t-panel) var(--ease-panel), transform var(--t-panel) var(--ease-panel);
}
.gl-conv.is-focus .gl-conv-list { opacity: 0; transform: translateX(-24px); pointer-events: none; overflow: hidden; }
.gl-conv-main { min-width: 0; }
.gl-conv.is-focus .gl-conv-main { max-width: 820px; width: 100%; margin: 0 auto; }
@media (max-width: 1099px) {
  .gl-conv { grid-template-columns: minmax(0, 1fr); }
  .gl-conv-list { position: static; max-height: none; }
}
.gl-conv-focusbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; }
.gl-conv-new {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--hit);
  margin-bottom: 8px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--accent-700);
  background: var(--accent-soft);
}
.gl-conv-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit-sm);
  padding: 0 12px;
  border-radius: 999px;
  border: 1px solid var(--field-border);
  background: white;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
  white-space: nowrap;
}
.gl-conv-btn[aria-pressed='true'] { background: var(--accent-soft); border-color: var(--accent-200); }
.gl-conv-kbd { border-radius: 6px; background: var(--state-them-bg); padding: 0 6px; font-size: 13px; font-weight: 500; color: var(--text-2); }
.gl-conv-kbd.is-dark { background: color-mix(in srgb, var(--c-white) 20%, transparent); color: white; }
.gl-conv-sticky { position: sticky; bottom: 16px; display: flex; justify-content: center; margin-top: 16px; pointer-events: none; }
.gl-conv-reply {
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 0 22px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 600;
  color: white;
  background: var(--accent-600);
  box-shadow: 0 10px 30px color-mix(in srgb, var(--c-shadow) 18%, transparent);
  transition: transform var(--t-press);
}
.gl-conv-reply:active { transform: scale(0.97); }
.gl-conv-new:focus-visible, .gl-conv-btn:focus-visible, .gl-conv-reply:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
