<template>
  <!-- GrowUp (zadání 2027 E3, návrh c): fronta k vyřízení na stránce Dnes. Jen věci přihlášeného uživatele
       (rozhodnutí Ivana). Data growupcrm.today_queue.get; každá karta se vyřídí přímo (GlQueueCard). -->
  <section class="flex min-w-0 flex-col" :aria-label="__('Fronta k vyřízení')">
    <div class="flex flex-wrap gap-2" role="toolbar" :aria-label="__('Filtr fronty')">
      <button
        v-for="f in filters"
        :key="f.key"
        type="button"
        class="gl-qf"
        :class="filter === f.key && 'is-on'"
        :aria-pressed="filter === f.key"
        @click="filter = f.key"
      >
        {{ f.label }} <span class="num"><GlNumber :value="f.count" /></span>
      </button>
    </div>

    <GlErrorBanner v-if="res.error" class="mt-3" :title="__('Frontu se nepodařilo načíst.')" @retry="res.reload()" />
    <div v-else-if="res.loading && !res.data" class="mt-3">
      <GlSkeleton variant="rows" :rows="3" />
    </div>
    <TransitionGroup v-else tag="div" name="gl-q" class="mt-3 flex flex-col gap-3">
      <GlQueueCard
        v-for="(it, i) in shown"
        :key="it.key"
        :ref="(el) => (cards[i] = el)"
        :item="it"
        @done="hide"
        @restore="unhide"
        @reload="reload"
        @send="send"
      />
    </TransitionGroup>
    <div v-if="res.data && !res.error && !shown.length" class="gl-q-empty">
      <span class="gl-q-empty-ic"><GlIcon name="check" :size="26" /></span>
      <h3 class="text-[20px] font-semibold text-[color:var(--text-1)]">{{ __('Všechno vyřízeno') }}</h3>
      <p class="text-[15px]">{{ __('Agent se ozve, až přijde odpověď nebo bude potřeba něco schválit.') }}</p>
      <p v-if="res.data.snoozed" class="text-[14px]">{{ __('Odložené položky: {0}', [res.data.snoozed]) }}</p>
    </div>
    <p v-if="shown.length" class="mt-4 hidden text-[13px] text-[color:var(--text-2)] md:block">
      <kbd class="gl-q-kbd">J</kbd> <kbd class="gl-q-kbd">K</kbd> {{ __('další karta') }} · <kbd class="gl-q-kbd">⌘↵</kbd> {{ __('odeslat') }} ·
      <kbd class="gl-q-kbd">E</kbd> {{ __('upravit') }} · <kbd class="gl-q-kbd">H</kbd> {{ __('odložit') }}
    </p>
  </section>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlNumber from '@/components/GlNumber.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlQueueCard from '@/components/Queue/GlQueueCard.vue'
import { undoToast } from '@/composables/glMail'
import { call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

const emit = defineEmits(['count'])
const res = createResource({ url: 'growupcrm.today_queue.get', auto: true, onSuccess: (d) => emit('count', d.total) })
const hidden = reactive(new Set())
const pending = new Map() // klíč karty → časovač odeslání
const filter = ref('all')
const cards = []

const LABELS = {
  reply: __('Odpovědi'),
  verify: __('Ověřit'),
  answer: __('Odpovědět'),
  week: __('Ke schválení'),
  link: __('Ukázky'),
  call: __('Hovory'),
  invoices: __('Faktury'),
  task: __('Úkoly'),
}
const items = computed(() => (res.data?.items || []).filter((i) => !hidden.has(i.key)))
const filters = computed(() => {
  const counts = {}
  for (const i of items.value) counts[i.kind] = (counts[i.kind] || 0) + 1
  return [{ key: 'all', label: __('Vše'), count: items.value.length }, ...Object.keys(LABELS).filter((k) => counts[k]).map((k) => ({ key: k, label: LABELS[k], count: counts[k] }))]
})
const shown = computed(() => (filter.value === 'all' ? items.value : items.value.filter((i) => i.kind === filter.value)))

function hide(it) {
  hidden.add(it.key)
  emit('count', items.value.length)
}
function unhide(it) {
  hidden.delete(it.key)
  emit('count', items.value.length)
}
async function reload() {
  await res.reload()
  // karty, jejichž odeslání ještě čeká (10 s), zůstanou skryté; jinak by šly vyřídit podruhé
  for (const k of [...hidden]) if (!pending.has(k)) hidden.delete(k)
}

// Odeslání konceptu agenta: 10 s na „Vrátit zpět“, pak outreach.approve s textem, který byl na kartě vidět.
// Zavření stránky během zdržení = nic neodejde, koncept zůstane ve frontě.
const UNDO_S = 10
function send({ item, payload }) {
  if (pending.has(item.key)) return // dvojí stisk: jeden časovač na kartu
  hide(item)
  const fire = async () => {
    pending.delete(item.key)
    if (undoToast.key === toastKey) undoToast.visible = false
    try {
      await call('growupcrm.outreach.approve', payload)
      toast.success(__('E-mail odeslán: {0}', [(item.to || []).join(', ')]))
      reload()
    } catch (e) {
      unhide(item)
      toast.error(e?.messages?.[0] || e?.message || __('E-mail se nepodařilo odeslat'))
    }
  }
  const timer = setTimeout(fire, UNDO_S * 1000)
  pending.set(item.key, timer)
  const toastKey = undoToast.key + 1
  Object.assign(undoToast, {
    visible: true,
    text: __('Odesílá se {0} · za {1} s', [(item.to || []).join(', '), UNDO_S]),
    seconds: UNDO_S,
    startedAt: Date.now(),
    busy: false,
    key: toastKey,
    onUndo: () => {
      clearTimeout(timer)
      pending.delete(item.key)
      undoToast.visible = false
      unhide(item)
      toast.success(__('Odeslání vráceno, návrh je zpět ve frontě'))
    },
  })
}
// odchod ze stránky během zdržení: odeslat hned by nebylo to, co člověk chtěl potvrdit časem; nic neodejde a návrh zůstane
onBeforeUnmount(() => {
  for (const t of pending.values()) clearTimeout(t)
  if (pending.size) {
    undoToast.visible = false
    toast.success(__('Odeslání zrušeno, návrh zůstal ve frontě'))
  }
  pending.clear()
})

// klávesy: J/K další/předchozí karta, ⌘↵ odeslat, E upravit, H odložit
let focusIndex = -1
function focusCard(i) {
  const list = document.querySelectorAll('.gl-qc')
  if (!list.length) return
  focusIndex = Math.max(0, Math.min(list.length - 1, i))
  list[focusIndex].focus()
  list[focusIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}
function onKey(e) {
  const t = e.target
  if (t?.closest?.('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return
  if (e.repeat) return
  // akce jen nad kartou, která má fokus (ne nad naposledy vybranou klávesou J/K)
  const el = document.activeElement?.closest?.('.gl-qc')
  const idx = el ? [...document.querySelectorAll('.gl-qc')].indexOf(el) : -1
  if (idx >= 0) focusIndex = idx
  const card = idx >= 0 ? cards[idx] : null
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') return card && (card.primary?.(), e.preventDefault())
  if (e.metaKey || e.ctrlKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (k === 'j') focusCard(focusIndex + 1), e.preventDefault()
  else if (k === 'k') focusCard(focusIndex - 1), e.preventDefault()
  else if (k === 'e' && card) card.edit?.(), e.preventDefault()
  else if (k === 'h' && card) card.snooze?.(), e.preventDefault()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
defineExpose({ reload })
</script>
<style scoped>
.gl-qf {
  display: inline-flex; align-items: center; gap: 6px; min-height: 40px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--field-border); background: var(--c-white); font-size: 14px; font-weight: 600; color: var(--text-2);
}
.gl-qf .num { color: var(--text-2); font-weight: 500; }
.gl-qf.is-on { background: var(--ink-pill, var(--text-1)); border-color: transparent; color: var(--c-white); }
.gl-qf.is-on .num { color: color-mix(in srgb, var(--c-white) 75%, transparent); }
.gl-qf:focus-visible { outline: none; box-shadow: var(--focus-ring); }
@media (pointer: coarse) { .gl-qf { min-height: var(--hit); } }
.gl-q-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 48px 16px; text-align: center; color: var(--text-2); }
.gl-q-empty-ic { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 50%; background: var(--accent-soft); color: var(--accent-600); margin-bottom: 6px; }
.gl-q-enter-active { transition: opacity var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out); }
.gl-q-enter-from { opacity: 0; transform: translateY(6px); }
.gl-q-leave-active { transition: opacity 160ms ease-in, transform 160ms ease-in; }
.gl-q-leave-to { opacity: 0; transform: translateX(-8px); }
.gl-q-move { transition: transform 200ms var(--ease-out); }
@media (prefers-reduced-motion: reduce) {
  .gl-q-enter-active, .gl-q-leave-active, .gl-q-move { transition: none; }
}
</style>
