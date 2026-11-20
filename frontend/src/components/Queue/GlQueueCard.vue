<template>
  <!-- GrowUp (zadání 2027 E3, návrh c): jedna karta fronty Dnes. Stavba: co se stalo → návrh → proč → akce.
       Odeslat pošle přesně text zobrazený na kartě (předmět a tělo, podpis stejnou funkcí jako při odeslání),
       s 10 s na „Vrátit zpět“; upravit = stejný editor jako u zakázky (GlComposer). Nic neschvaluje samo. -->
  <article class="gl-qc" :class="busy && 'is-busy'" :data-kind="item.kind" tabindex="-1">
    <header class="flex flex-wrap items-center gap-2">
      <span class="gl-qc-kind"><GlIcon :name="meta.icon" :size="16" />{{ meta.label }}</span>
      <router-link v-if="item.lead" :to="{ name: 'Lead', params: { leadId: item.lead } }" class="gl-qc-org">
        {{ item.organization || item.lead_title }}
      </router-link>
      <span v-else-if="item.organization" class="gl-qc-org">{{ item.organization }}</span>
      <span v-if="item.reply_type" class="gl-qc-chip">{{ item.reply_type }}</span>
      <span v-if="item.kind === 'task' && item.days_overdue > 0" class="gl-qc-chip is-bad">
        <GlIcon name="alert" :size="13" />{{ item.days_overdue === 1 ? __('1 den po termínu') : __('{0} dní po termínu', [item.days_overdue]) }}
      </span>
      <span class="ml-auto text-[13px] text-[color:var(--text-2)]">{{ when }}</span>
    </header>

    <!-- odpověď od agenta -->
    <template v-if="item.kind === 'reply'">
      <p class="mt-2 text-[15px] text-[color:var(--text-1)]">{{ item.happened }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -- text firmy escapuje server (sales_agent._escape) a ještě sanitizeHTML -->
      <blockquote v-if="item.incoming?.text" class="gl-qc-quote" v-html="clean(item.incoming.text)" />
      <div v-if="!editing" class="gl-qc-draft">
        <div class="mb-1 text-[13px] text-[color:var(--text-2)]">
          {{ __('Komu') }}: {{ (item.to || []).join(', ') }} · {{ __('Předmět') }}: <b class="font-semibold text-[color:var(--text-1)]">{{ item.subject }}</b>
        </div>
        <!-- eslint-disable-next-line vue/no-v-html -- sanitizeHTML + zvýraznění míst k doplnění -->
        <div class="gl-qc-text" lang="cs" v-html="draftHtml" />
      </div>
      <GlWhy v-if="item.why?.length" :reasons="item.why" :title="__('Proč tenhle návrh')">
        <p class="mt-1 text-[14px] text-[color:var(--text-2)]">{{ item.reason }}</p>
      </GlWhy>
      <div v-if="editing" class="mt-3">
        <GlComposer
          :draftKey="composerKey"
          :defaults="{ to: item.to || [], subject: item.subject, html: item.html }"
          :outreachReply="item.incoming?.name || ''"
          :title="__('Návrh agenta – upravte a odešlete')"
          @sent="afterEditSent"
          @close="editing = false"
        />
      </div>
      <div v-else class="gl-qc-acts">
        <button type="button" class="gl-q-btn is-primary" :disabled="busy" @click="primary">
          <GlIcon name="send" :size="16" />{{ placeholders ? __('Doplnit a odeslat') : __('Odeslat') }}<kbd class="gl-q-kbd is-dark">⌘↵</kbd>
        </button>
        <button type="button" class="gl-q-btn" :disabled="busy" @click="edit"><GlIcon name="edit" :size="16" />{{ __('Upravit') }}<kbd class="gl-q-kbd">E</kbd></button>
        <button type="button" class="gl-q-btn" :disabled="busy" @click="reject"><GlIcon name="x" :size="16" />{{ __('Zahodit') }}</button>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
        <span v-if="placeholders" class="gl-qc-warn">{{ placeholders === 1 ? __('1 místo k doplnění') : __('{0} míst k doplnění', [placeholders]) }}</span>
      </div>
    </template>

    <!-- odpověď spárovaná jen podle adresy -->
    <template v-else-if="item.kind === 'verify'">
      <p class="mt-2 text-[15px]">{{ __('Odpověď přišla z adresy {0}, ale ne ve vlákně kampaně. Agent s ní nic neudělal, dokud ji nepotvrdíte.', [item.email]) }}</p>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <blockquote class="gl-qc-quote" v-html="clean(item.text)" />
      <div class="gl-qc-acts">
        <button type="button" class="gl-q-btn is-primary" :disabled="busy" @click="confirmReply"><GlIcon name="check" :size="16" />{{ __('Potvrdit odpověď') }}</button>
        <router-link :to="{ name: 'Outreach', params: { tab: 'replies' } }" class="gl-q-btn">{{ __('Otevřít v Odpovědích') }}</router-link>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </div>
    </template>

    <!-- komu odpovědět -->
    <template v-else-if="item.kind === 'answer'">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <blockquote class="gl-qc-quote" v-html="clean(item.text)" />
      <div class="gl-qc-acts">
        <router-link :to="answerLink" class="gl-q-btn is-primary"><GlIcon name="reply" :size="16" />{{ __('Odpovědět') }}</router-link>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </div>
    </template>

    <!-- týden ke schválení -->
    <template v-else-if="item.kind === 'week'">
      <p class="mt-2 text-[16px] font-semibold">{{ item.title }} · {{ __('{0} e-mailů čeká na schválení', [item.pending]) }}</p>
      <p class="text-[14px] text-[color:var(--text-2)]">{{ __('Agent připravil firmy a e-maily. Nic neodejde, dokud týden neschválíte.') }}</p>
      <div class="gl-qc-acts">
        <router-link :to="{ name: 'WeekApprove', params: { name: item.id } }" class="gl-q-btn is-primary"><GlIcon name="check" :size="16" />{{ __('Projít a schválit') }}</router-link>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </div>
    </template>

    <!-- vložit odkaz na ukázku -->
    <template v-else-if="item.kind === 'link'">
      <p class="mt-2 text-[15px]">{{ item.title }}</p>
      <p class="text-[14px] text-[color:var(--text-2)]">{{ __('Až vložíte odkaz, agent připraví e-mail s ukázkou do vlákna a pošle vám ho ke schválení.') }}</p>
      <form class="gl-qc-acts" @submit.prevent="saveLink">
        <input v-model="url" type="url" inputmode="url" required class="gl-qc-field" :placeholder="__('https://… odkaz na ukázku')" :aria-label="__('Odkaz na ukázku')" />
        <button type="submit" class="gl-q-btn is-primary" :disabled="busy || !validUrl"><GlIcon name="link" :size="16" />{{ __('Vložit') }}</button>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </form>
    </template>

    <!-- zavolat -->
    <template v-else-if="item.kind === 'call'">
      <p class="mt-2 text-[15px]">{{ item.title }}</p>
      <p v-if="item.description" class="text-[14px] text-[color:var(--text-2)]">{{ item.description }}</p>
      <div class="gl-qc-acts">
        <a v-if="item.phone" :href="'tel:' + item.phone.replace(/\s+/g, '')" class="gl-q-btn is-primary"><GlIcon name="phone" :size="16" />{{ item.phone }}</a>
        <span v-else class="text-[14px] text-[color:var(--text-2)]">{{ __('Telefon u zakázky chybí') }}</span>
        <button type="button" class="gl-q-btn" :disabled="busy" @click="logCall('reached')"><GlIcon name="check" :size="16" />{{ __('Dovolal jsem se') }}</button>
        <button type="button" class="gl-q-btn" :disabled="busy" @click="logCall('no_answer')">{{ __('Nebral') }}</button>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </div>
    </template>

    <!-- faktury (jen vedoucí; data posílá server jen jemu) -->
    <template v-else-if="item.kind === 'invoices'">
      <ul class="mt-2 flex flex-col gap-1 text-[15px]">
        <li v-for="d in item.drafts" :key="d.name" class="flex flex-wrap gap-x-3">
          <span class="text-[color:var(--text-2)]">{{ __('K vystavení') }}</span><span class="min-w-0 flex-1 truncate">{{ d.description || d.organization }}</span>
          <span class="num font-semibold">{{ money(d.amount) }}</span>
        </li>
        <li v-for="d in item.overdue" :key="d.name" class="flex flex-wrap gap-x-3">
          <span class="text-[color:var(--overdue)]">{{ __('Po splatnosti') }}</span><span class="min-w-0 flex-1 truncate">{{ d.number }} · {{ d.organization }}</span>
          <span class="num font-semibold">{{ money(d.amount) }}</span>
        </li>
      </ul>
      <div class="gl-qc-acts">
        <router-link :to="{ name: 'Invoices' }" class="gl-q-btn is-primary"><GlIcon name="doc" :size="16" />{{ __('Otevřít faktury') }}</router-link>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
      </div>
    </template>

    <!-- úkol po termínu -->
    <template v-else>
      <p class="mt-2 text-[16px] font-semibold">{{ item.title }}</p>
      <div class="gl-qc-acts">
        <button type="button" class="gl-q-btn is-primary" :disabled="busy" @click="taskDone"><GlIcon name="check" :size="16" />{{ __('Hotovo') }}</button>
        <GlSnoozeMenu ref="snz" kbd @snooze="snooze" />
        <button type="button" class="gl-q-btn" :disabled="busy" @click="taskCancel"><GlIcon name="x" :size="16" />{{ __('Zrušit úkol') }}</button>
      </div>
    </template>
  </article>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlWhy from '@/components/Agent/GlWhy.vue'
import GlComposer from '@/components/Email/GlComposer.vue'
import GlSnoozeMenu from '@/components/Queue/GlSnoozeMenu.vue'
import { countPlaceholders, PLACEHOLDER_RE } from '@/composables/glMail'
import { useRouter } from 'vue-router'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { decideAfterUndo } from '@/composables/glAgentProposals'
import { sanitizeHTML } from '@/utils'
import { call, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ item: { type: Object, required: true } })
// done: karta je vyřízená (odjede); restore: vrátit po „Vrátit zpět“; reload: načíst frontu znovu
const emit = defineEmits(['done', 'restore', 'reload', 'send'])
const router = useRouter()
const busy = ref(false)
const editing = ref(false)
const url = ref('')
const snz = ref(null)

const META = {
  reply: { icon: 'sparkles', label: __('Odpověď zájemci od agenta') },
  verify: { icon: 'alert', label: __('Ověřit odpověď') },
  answer: { icon: 'reply', label: __('Komu odpovědět') },
  week: { icon: 'check', label: __('Ke schválení') },
  link: { icon: 'link', label: __('Vložit odkaz na ukázku') },
  call: { icon: 'phone', label: __('Zavolat') },
  invoices: { icon: 'doc', label: __('Faktury') },
  task: { icon: 'clock', label: __('Úkol po termínu') },
}
const meta = computed(() => META[props.item.kind] || META.task)
const nf = new Intl.NumberFormat('cs-CZ')
const money = (v) => `${nf.format(Number(v) || 0)} Kč`
const when = computed(() => {
  const v = props.item.at
  if (!v) return ''
  const d = new Date(String(v).replace(' ', 'T'))
  const today = new Date()
  const same = d.toDateString() === today.toDateString()
  const hm = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  return same ? __('dnes {0}', [hm]) : `${d.getDate()}. ${d.getMonth() + 1}.`
})
const clean = (html) => sanitizeHTML(html || '')
const placeholders = computed(() => countPlaceholders(props.item.html))
const draftHtml = computed(() => {
  const doc = new DOMParser().parseFromString(sanitizeHTML(props.item.html || ''), 'text/html')
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) if (new RegExp(PLACEHOLDER_RE.source).test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode)
  nodes.forEach((n) => {
    const frag = doc.createDocumentFragment()
    let last = 0
    for (const m of n.nodeValue.matchAll(new RegExp(PLACEHOLDER_RE.source, 'g'))) {
      frag.append(n.nodeValue.slice(last, m.index))
      const mark = doc.createElement('mark')
      mark.className = 'gl-ph'
      mark.textContent = m[0]
      frag.append(mark)
      last = m.index + m[0].length
    }
    frag.append(n.nodeValue.slice(last))
    n.replaceWith(frag)
  })
  return sanitizeHTML(doc.body.innerHTML)
})
const composerKey = computed(() => ({
  reference_doctype: 'CRM Lead',
  reference_name: props.item.lead || '',
  thread_id: props.item.incoming?.name ? 'outreach:' + props.item.incoming.name : '',
  local_id: 'queue-' + props.item.id,
}))
const answerLink = computed(() =>
  props.item.lead ? { name: 'Lead', params: { leadId: props.item.lead }, hash: '#emails' } : { name: 'Outreach', params: { tab: 'replies' } },
)
const validUrl = computed(() => /^https?:\/\/\S+\.\S+/.test(url.value.trim()))
const err = (e) => toast.error(e?.messages?.[0] || e?.message || __('Nepovedlo se'))

// Odeslat: snímek přesně toho, co je vidět (předmět a tělo; podpis dosadí server stejnou funkcí jako v náhledu).
// Zdržení 10 s a „Vrátit zpět“ řídí GlQueue (karta mezitím zmizí ze seznamu).
function primary() {
  if (placeholders.value) return edit() // místo k doplnění: nejdřív editor
  emit('send', { item: props.item, payload: { name: props.item.id, subject: props.item.subject, body: props.item.body } })
}
function edit() {
  if (!props.item.lead || !props.item.incoming?.name) {
    router.push({ name: 'OutreachReview', params: { name: props.item.id } })
    return
  }
  editing.value = true
}
function afterEditSent(sent) {
  // odesláno z editoru (mail_threads.send, se zdržením a vrácením z E1); návrh se uzavře až po uplynutí
  // „Vrátit zpět“ a s odeslaným textem (decideAfterUndo); při vrácení zůstane ve frontě
  editing.value = false
  emit('done', props.item)
  decideAfterUndo({ id: props.item.id, html: props.item.html }, sent, { onDone: () => emit('reload') })
}
async function run(fn, okText) {
  busy.value = true
  try {
    await fn()
    if (okText) toast.success(okText)
    emit('done', props.item)
    emit('reload')
  } catch (e) {
    err(e)
  } finally {
    busy.value = false
  }
}
const reject = () => run(() => call('growupcrm.sales_agent.reject_draft', { name: props.item.id }), __('Návrh zahozen, nic neodešlo'))
const confirmReply = () => run(() => call('growupcrm.sales_agent.confirm_reply', { name: props.item.id }), __('Odpověď potvrzena'))
const saveLink = () =>
  run(
    () => call('frappe.client.set_value', { doctype: 'CRM Lead', name: props.item.lead, fieldname: 'preview_url', value: url.value.trim() }),
    __('Odkaz uložen, e-mail s ukázkou se připraví ke schválení'),
  )
async function logCall(outcome) {
  await run(async () => {
    await call('growupcrm.lead_actions.quick_call', { lead: props.item.lead, outcome })
    if (outcome === 'reached') await call('frappe.client.set_value', { doctype: 'CRM Task', name: props.item.id, fieldname: 'status', value: 'Done' })
    else await snoozeTask(nextMorning())
  }, outcome === 'reached' ? __('Hovor zapsán, úkol hotový') : __('Zapsáno, připomenu zítra'))
}
function nextMorning() {
  const d = new Date()
  do d.setDate(d.getDate() + 1)
  while (d.getDay() === 0 || d.getDay() === 6)
  d.setHours(9, 0, 0, 0)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 09:00:00`
}
const snoozeTask = (until) => call('frappe.client.set_value', { doctype: 'CRM Task', name: props.item.id, fieldname: 'due_date', value: until })
function snooze({ until, label }) {
  const isTask = ['task', 'call', 'link'].includes(props.item.kind)
  run(() => (isTask ? snoozeTask(until) : call('growupcrm.today_queue.snooze', { key: props.item.key, until })), __('Odloženo: {0}', [label]))
}
async function taskDone() {
  emit('done', props.item)
  try {
    await completeTaskWithUndo(props.item.id, props.item.title, () => emit('reload'))
  } catch (e) {
    err(e)
    emit('restore', props.item)
  }
}
const taskCancel = () =>
  run(() => call('frappe.client.set_value', { doctype: 'CRM Task', name: props.item.id, fieldname: 'status', value: 'Canceled' }), __('Úkol zrušen'))

defineExpose({ primary: () => (props.item.kind === 'reply' ? primary() : null), edit: () => props.item.kind === 'reply' && edit(), snooze: () => snz.value?.toggle() })
</script>
<style>
.gl-q-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: var(--hit, 44px); padding: 0 16px;
  border-radius: 999px; font-size: 15px; font-weight: 600; color: var(--text-1); background: #fff; border: 1px solid var(--field-border);
  white-space: nowrap; transition: transform var(--t-press, 90ms), border-color var(--t-fast, 120ms), background-color var(--t-fast, 120ms);
}
.gl-q-btn:hover { border-color: var(--accent-200); }
.gl-q-btn:active { transform: scale(0.97); }
.gl-q-btn:disabled { opacity: 0.55; }
.gl-q-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-q-btn.is-primary { background: var(--accent-600); color: #fff; border-color: transparent; }
.gl-q-btn.is-primary:hover { background: var(--accent-700); }
.gl-q-kbd { border-radius: 6px; padding: 0 6px; font-size: 13px; font-weight: 500; background: var(--fill-tinted); color: var(--text-2); }
.gl-q-kbd.is-dark { background: rgba(255, 255, 255, 0.2); color: #fff; }
@media (max-width: 767px) { .gl-q-kbd { display: none; } }
</style>
<style scoped>
.gl-qc {
  padding: 16px 18px; border-radius: 20px; background: #fff; border: 1px solid var(--line); box-shadow: 0 4px 18px rgba(40, 50, 120, 0.05);
  outline: none; transition: border-color var(--t-fast);
}
.gl-qc:focus, .gl-qc:focus-within { border-color: var(--accent-200); }
.gl-qc.is-busy { opacity: 0.7; }
.gl-qc-kind { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 650; color: var(--accent-700); }
.gl-qc-org { font-size: 15px; font-weight: 600; color: var(--text-1); }
a.gl-qc-org:hover { text-decoration: underline; }
.gl-qc-chip { display: inline-flex; align-items: center; gap: 4px; min-height: 24px; padding: 0 9px; border-radius: 999px; font-size: 13px; font-weight: 600; background: var(--fill-tinted); color: var(--text-2); }
.gl-qc-chip.is-bad { color: var(--overdue); }
.gl-qc-quote { margin: 10px 0; padding: 2px 0 2px 12px; border-left: 3px solid var(--field-border); color: var(--text-2); font-size: 15px; white-space: pre-line; overflow-wrap: anywhere; }
.gl-qc-draft { margin: 10px 0; padding: 12px 14px; border-radius: 14px; background: var(--accent-50); }
.gl-qc-text { font-size: var(--read-size, 16px); line-height: 1.55; color: var(--text-1); max-width: var(--read-w, 720px); overflow-wrap: break-word; }
.gl-qc-text :deep(p) { margin: 0 0 0.6em; }
.gl-qc-text :deep(.gl-ph) { background: var(--warn-bg); color: var(--warn-fg); font-weight: 600; border-radius: 4px; padding: 0 3px; }
.gl-qc-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 12px; }
.gl-qc-warn { margin-left: auto; font-size: 14px; font-weight: 600; color: var(--warn-fg); }
.gl-qc-field { flex: 1 1 220px; min-width: 0; min-height: var(--hit, 44px); padding: 0 14px; border-radius: var(--r-field, 14px); border: 1px solid var(--field-border); font-size: 16px; background: #fff; }
.gl-qc-field:focus { outline: none; border-color: var(--accent-400); box-shadow: var(--focus-ring); }
</style>
