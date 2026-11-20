<template>
  <!-- GrowUp (zadání 2027 E1): karta návrhu agenta pod vláknem – co se stalo, návrh, proč, akce.
       Vzor stavů čeká / schváleno / zamítnuto: ai-elements-vue Confirmation (Apache-2.0,
       https://github.com/vuepont/ai-elements-vue), přepsáno bez typu `ai`. Úprava otevře stejný editor (GlComposer). -->
  <section class="gl-ad" :aria-label="__('Návrh odpovědi od agenta')">
    <header class="flex flex-wrap items-center gap-2">
      <span class="gl-ad-badge"><GlIcon name="sparkles" :size="15" />{{ __('Návrh odpovědi od agenta') }}</span>
      <span class="gl-ad-chip" :class="proposal.level === 'vždy člověk' && 'is-human'">{{ proposal.level === 'vždy člověk' ? __('Vždy člověk') : __('Ke schválení') }}</span>
      <span v-if="proposal.demo" class="gl-ad-chip">{{ __('ukázka') }}</span>
    </header>
    <p class="mt-2 text-[15px] text-ink-gray-9"><b class="font-semibold">{{ __('Proč:') }}</b> {{ proposal.reason }}</p>
    <button v-if="proposal.why?.length" type="button" class="gl-ad-why" :aria-expanded="whyOpen" @click="whyOpen = !whyOpen">
      <GlIcon name="down" :size="15" :class="whyOpen && 'rotate-180'" />{{ whyOpen ? __('Skrýt podrobnosti') : __('Podrobnosti') }}
    </button>
    <div class="gl-ad-whybox" :class="whyOpen && 'is-open'">
      <div><ul class="list-disc pl-5 text-[14.5px] text-[color:var(--text-2)]"><li v-for="w in proposal.why" :key="w">{{ w }}</li></ul></div>
    </div>
    <!-- eslint-disable-next-line vue/no-v-html -- sanitizeHTML (DOMPurify) + zvýraznění míst k doplnění -->
    <div class="gl-ad-text" lang="cs" v-html="previewHtml" />
    <div class="mt-3 flex flex-wrap items-center gap-2">
      <button type="button" class="gl-ad-send" @click="approve"><GlIcon name="send" :size="16" />{{ placeholders ? __('Doplnit a odeslat') : __('Odeslat') }}</button>
      <button type="button" class="gl-ad-btn" @click="$emit('edit', proposal)"><GlIcon name="edit" :size="16" />{{ __('Upravit') }} <kbd class="gl-ad-kbd">E</kbd></button>
      <button type="button" class="gl-ad-btn" @click="reject"><GlIcon name="x" :size="16" />{{ __('Zahodit') }}</button>
      <span v-if="placeholders" class="ml-auto text-[14px] font-medium text-[color:var(--warn-fg)]">{{ placeholders === 1 ? __('1 místo k doplnění') : __('{0} míst k doplnění', [placeholders]) }}</span>
    </div>
  </section>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { countPlaceholders, PLACEHOLDER_RE } from '@/composables/glMail'
import { decideProposal } from '@/composables/glAgentProposals'
import { sanitizeHTML } from '@/utils'
import { toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const props = defineProps({ proposal: { type: Object, required: true } })
const emit = defineEmits(['edit', 'send', 'rejected'])
const whyOpen = ref(false)
const placeholders = computed(() => countPlaceholders(props.proposal.html))
// zvýraznění jen v textových uzlech (ne řetězcovou náhradou v HTML), pak ještě jednou čištění
const previewHtml = computed(() => {
  const doc = new DOMParser().parseFromString(sanitizeHTML(props.proposal.html || ''), 'text/html')
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

function approve() {
  // návrh s místem k doplnění se nejdřív otevře v editoru; jinak jde k odeslání stejnou cestou jako ruční e-mail
  if (placeholders.value) emit('edit', props.proposal)
  else emit('send', props.proposal)
}
async function reject() {
  try {
    await decideProposal(props.proposal, 'rejected')
    emit('rejected', props.proposal)
  } catch (e) {
    toast.error(e?.messages?.[0] || __('Návrh se nepodařilo zahodit'))
  }
}
</script>
<style scoped>
.gl-ad {
  margin-top: 16px;
  padding: 16px;
  border-radius: 20px;
  background: var(--accent-50);
  border: 1px solid var(--accent-200);
  animation: gl-ad-in var(--t-base) var(--ease-out);
}
@keyframes gl-ad-in { from { opacity: 0; transform: translateY(6px); } }
.gl-ad-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 15px; font-weight: 650; color: var(--accent-900); }
.gl-ad-chip { display: inline-flex; align-items: center; height: 24px; padding: 0 9px; border-radius: 999px; font-size: 13px; font-weight: 600; color: var(--accent-700); background: white; }
.gl-ad-chip.is-human { color: var(--warn-fg); background: var(--warn-bg); }
.gl-ad-why { display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit-sm); padding: 0 8px; margin-left: -8px; border-radius: 10px; font-size: 14px; color: var(--text-2); }
.gl-ad-why:hover { color: var(--text-1); }
.gl-ad-whybox { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--t-panel) var(--ease-panel); }
.gl-ad-whybox > div { overflow: hidden; min-height: 0; }
.gl-ad-whybox.is-open { grid-template-rows: 1fr; }
.gl-ad-text { margin-top: 12px; padding: 14px 16px; border-radius: 14px; background: white; font-size: var(--read-size); line-height: 1.55; color: var(--text-1); max-width: calc(var(--read-w) + 32px); }
.gl-ad-text :deep(p) { margin: 0 0 0.6em; }
.gl-ad-text :deep(.gl-ph) { background: var(--warn-bg); color: var(--warn-fg); font-weight: 600; border-radius: 4px; padding: 0 3px; }
.gl-ad-send, .gl-ad-btn { display: inline-flex; align-items: center; gap: 8px; min-height: var(--hit); padding: 0 16px; border-radius: 999px; font-size: 15px; font-weight: 600; }
.gl-ad-send { color: white; background: var(--accent-600); }
.gl-ad-btn { color: var(--text-1); background: white; border: 1px solid var(--field-border); }
.gl-ad-kbd { border-radius: 6px; background: var(--state-them-bg); padding: 0 6px; font-size: 13px; font-weight: 500; }
.gl-ad-send:focus-visible, .gl-ad-btn:focus-visible, .gl-ad-why:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
