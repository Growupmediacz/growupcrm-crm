<template>
  <!-- GrowUp (zadání 2027 E1, návrh b): vlákno e-mailů přes celou obrazovku (hlavně telefon), jeden posuvník,
       dole pilulka „Odpovědět…“, editor jako spodní panel do 92 % výšky. Spodní lišta aplikace je tu schovaná (E2, MobileLayout). -->
  <div class="gl-mt">
    <header class="gl-mt-top">
      <button type="button" class="gl-mt-icon" :aria-label="__('Zpět na zakázku')" @click="back"><GlIcon name="left" :size="22" /></button>
      <div class="min-w-0 flex-1">
        <div class="truncate text-[16px] font-[650] text-ink-gray-9">{{ lead.data?.order_title || lead.data?.lead_name || leadId }}</div>
        <div class="truncate text-[13px] text-[color:var(--text-2)]">{{ lead.data?.status }}</div>
      </div>
    </header>
    <div class="gl-mt-body">
      <GlErrorBanner v-if="thread.error" :title="__('Vlákno se nepodařilo načíst')" :text="thread.error?.messages?.[0] || ''" @retry="load" />
      <GlThread :thread="thread.data" :loading="thread.loading" @reply="startReply">
        <template #below>
          <GlAgentDraft v-if="proposal && !composer" :proposal="proposal" @edit="editProposal" @send="editProposal" @rejected="proposal = null" />
        </template>
      </GlThread>
    </div>
    <div v-if="thread.data && !composer" class="gl-mt-dock">
      <button type="button" class="gl-mt-reply" @click="startReply({ mode: 'reply' })">
        <span class="flex-1 text-left">{{ hasDraft ? __('Pokračovat v konceptu…') : __('Odpovědět…') }}</span>
        <span v-if="proposal" class="gl-mt-chip"><GlIcon name="sparkles" :size="14" />{{ __('návrh') }}</span>
        <GlIcon name="reply" :size="20" />
      </button>
    </div>
    <GlComposer
      v-if="composer"
      mode="sheet"
      :draftKey="{ reference_doctype: 'CRM Lead', reference_name: leadId, thread_id: threadId }"
      :defaults="composer.defaults"
      :quote="composer.quote"
      :doc="lead.data"
      :title="composer.title || __('Odpověď')"
      @sent="afterSent"
      @close="(e) => ((composer = null), (hasDraft = !e?.discarded))"
    />
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlThread from '@/components/Email/GlThread.vue'
import GlComposer from '@/components/Email/GlComposer.vue'
import GlAgentDraft from '@/components/Agent/GlAgentDraft.vue'
import { replyDraft, restoredDraft } from '@/composables/glMail'
import { proposalForThread } from '@/composables/glAgentProposals'
import { createResource, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  leadId: { type: String, required: true },
  threadId: { type: String, required: true },
})
const router = useRouter()
const composer = ref(null)
const proposal = ref(null)
const hasDraft = ref(false)

const lead = createResource({
  url: 'frappe.client.get_value',
  params: { doctype: 'CRM Lead', filters: { name: props.leadId }, fieldname: ['name', 'order_title', 'lead_name', 'status', 'email', 'first_name', 'last_name'] },
  auto: true,
})
const thread = createResource({ url: 'growupcrm.mail_threads.get_thread' })
usePageMeta(() => ({ title: thread.data?.subject || __('E-mail') }))

async function load() {
  await thread.fetch({ reference_doctype: 'CRM Lead', reference_name: props.leadId, thread_id: props.threadId })
  proposal.value = await proposalForThread({ doctype: 'CRM Lead', name: props.leadId }, thread.data)
  try {
    const list = await createResource({ url: 'growupcrm.mail_threads.list_threads' }).fetch({ reference_doctype: 'CRM Lead', reference_name: props.leadId })
    hasDraft.value = Boolean(list?.threads?.find((t) => t.id === props.threadId)?.has_draft)
  } catch {
    hasDraft.value = false
  }
}
watch(() => props.threadId, load, { immediate: true })
watch(restoredDraft, (r) => r && r.key.thread_id === props.threadId && load().then(() => startReply({ mode: 'reply' })))

function back() {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'Lead', params: { leadId: props.leadId } })
}
function startReply({ mode = 'reply', message = null } = {}) {
  composer.value = replyDraft(thread.data, { mode, message })
}
function editProposal(p) {
  const m = [...(thread.data?.messages || [])].reverse().find((x) => x.sent_or_received === 'Received' && !x.automated)
  composer.value = { title: __('Návrh agenta'), defaults: { to: p.to || [], subject: p.subject, in_reply_to: m?.name || '', html: p.html }, quote: m || null }
}
async function afterSent() {
  composer.value = null
  proposal.value = null
  hasDraft.value = false
  await load()
}
</script>
<style scoped>
.gl-mt { display: flex; min-height: 100%; flex-direction: column; padding-bottom: calc(88px + env(safe-area-inset-bottom)); }
.gl-mt-top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--mat-bar); backdrop-filter: var(--mat-blur); border-bottom: 1px solid var(--line); }
.gl-mt-icon { display: grid; place-items: center; width: var(--hit); height: var(--hit); border-radius: 14px; color: var(--text-1); }
.gl-mt-body { padding: 16px; max-width: 860px; width: 100%; margin: 0 auto; }
.gl-mt-dock { position: fixed; left: 12px; right: 12px; z-index: 30; bottom: max(12px, env(safe-area-inset-bottom)); display: flex; }
@media (min-width: 768px) { .gl-mt-dock { left: 50%; right: auto; transform: translateX(-50%); width: 560px; bottom: 104px; } }
.gl-mt-reply {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 18px;
  border-radius: 26px;
  border: var(--mat-card-border);
  background: var(--mat-bar);
  backdrop-filter: var(--mat-blur);
  box-shadow: 0 12px 36px rgba(40, 50, 120, 0.2);
  font-size: 16px;
  color: var(--text-2);
}
.gl-mt-chip { display: inline-flex; align-items: center; gap: 4px; height: 26px; padding: 0 10px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--accent-700); background: var(--accent-soft); }
.gl-mt-icon:focus-visible, .gl-mt-reply:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
