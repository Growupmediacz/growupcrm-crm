<template>
  <!-- GrowUp: agent kampaně (growupcrm.campaign_agent) – texty od Claude, schválení, plán, prokliky na ukázku -->
  <div class="gl-card flex flex-col gap-4 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="flex items-center gap-2 text-[20px] font-bold text-ink-gray-9"><GlIcon name="sparkles" :size="19" class="text-[#4f46e5]" />{{ __('Agent kampaně') }}</h2>
        <p class="mt-1 text-[14px] text-ink-gray-6">{{ __('Agent napíše každé firmě 3 e-maily z dat jejího webu a ukázky jejího oboru. Cíl: proklik na ukázku a audit zdarma.') }}</p>
      </div>
      <span v-if="s?.auto_send" class="rounded-full bg-[rgba(34,179,94,.12)] px-3 py-1 text-[13px] font-semibold text-[#178a4a]">{{ __('Schváleno, odesílá se samo') }}</span>
    </div>

    <div v-if="s && !s.configured" class="rounded-[14px] bg-[rgba(214,130,20,.1)] px-4 py-3 text-[14px] text-[#8a4b00]">{{ __('Agent nemá API klíč Anthropic, obraťte se na správce.') }}</div>

    <template v-if="s">
      <!-- výsledky -->
      <div class="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div v-for="k in KPIS" :key="k.key" class="rounded-[14px] bg-[rgba(110,120,200,.06)] px-3 py-2">
          <div class="text-[12px] text-ink-gray-5">{{ k.label }}</div>
          <div class="num text-[24px] font-bold text-ink-gray-9">{{ k.value(s) }}</div>
        </div>
      </div>

      <!-- nastavení -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FormControl type="select" :label="__('Odesílatel (Gmail)')" v-model="form.sender" :options="[{ label: __('Schránka Outreach'), value: '' }, ...s.senders]" />
        <FormControl type="number" :label="__('Denní limit e-mailů')" v-model="form.daily_limit" />
        <FormControl type="number" :label="__('Odesílat od (hodina)')" v-model="form.window_start" />
        <FormControl type="number" :label="__('Odesílat do (hodina)')" v-model="form.window_end" />
      </div>
      <FormControl type="textarea" :label="__('Pokyny pro agenta (nepovinné)')" v-model="form.ai_notes" :placeholder="__('Např. zmiň jarní sezónu, piš kratší e-maily…')" />
      <div class="flex flex-wrap items-center gap-2">
        <Button :label="__('Uložit nastavení')" :disabled="!dirty" :loading="busy === 'save'" @click="save" />
        <Button v-if="!s.auto_send" variant="solid" :label="s.ai.ready ? __('Napsat e-maily pro zbývající') : __('Napsat e-maily agentem')"
          :disabled="!s.configured || s.ai.queued > 0" :loading="busy === 'prepare'" @click="prepare(0)" />
        <Button v-if="!s.auto_send && s.ai.ready" :label="__('Přepsat všechny znovu')" :disabled="s.ai.queued > 0" @click="prepare(1)" />
        <span class="text-[13px] text-ink-gray-6">
          {{ __('Texty: {0} z {1} hotovo', [s.ai.ready, s.ai.total]) }}<template v-if="s.ai.queued"> · {{ __('agent píše ({0})…', [s.ai.queued]) }}</template>
          <template v-if="s.ai.failed"> · <span class="text-[#a82614]">{{ __('{0} chyb', [s.ai.failed]) }}</span></template>
        </span>
      </div>
      <div v-for="e in s.errors" :key="e.organization" class="text-[13px] text-[#a82614]">{{ e.organization }}: {{ e.ai_error }}</div>

      <!-- ukázky ke kontrole -->
      <div v-if="s.samples.length">
        <h3 class="mb-2 text-[16px] font-bold text-ink-gray-9">{{ s.auto_send ? __('Nejbližší naplánované e-maily') : __('Ukázky ke kontrole') }}</h3>
        <div v-for="m in s.samples" :key="m.name" class="mb-2 rounded-[16px] border border-[rgba(110,120,200,.16)] p-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink-gray-5">
            <span><b class="text-ink-gray-9">{{ m.organization }}</b> · {{ m.email }}</span>
            <span v-if="m.scheduled_at">{{ __('odejde') }} {{ formatDate(m.scheduled_at) }}</span>
            <router-link v-else :to="{ name: 'OutreachReview', params: { name: m.name } }" class="text-[#4F46E5] hover:underline">{{ __('Upravit') }}</router-link>
          </div>
          <div class="mt-1 text-[15px] font-bold text-ink-gray-9">{{ m.subject }}</div>
          <div class="gl-mail mt-1 text-[14px] leading-relaxed text-ink-gray-8" v-html="m.body" />
          <details v-if="m.followups.length" class="mt-2 text-[13px] text-ink-gray-7">
            <summary class="cursor-pointer text-ink-gray-5">{{ __('Navazující e-maily') }}</summary>
            <div v-for="(f, i) in m.followups" :key="i" class="mt-3 rounded-[12px] bg-[rgba(110,120,200,.05)] p-3"><b class="text-ink-gray-9">{{ f[0] }}</b><div class="mt-1" v-html="f[1]" /></div>
          </details>
        </div>
      </div>

      <!-- schválení -->
      <div v-if="!s.auto_send && s.pending" class="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[rgba(79,70,229,.07)] px-4 py-3">
        <div class="text-[14px] text-ink-gray-8">
          {{ __('{0} e-mailů připraveno. Po schválení se rozplánují do kalendáře (nejvýš {1} denně, {2}–{3} h, jen pracovní dny) a odejdou samy.', [s.pending, form.daily_limit, form.window_start, form.window_end]) }}
        </div>
        <Button variant="solid" :label="__('Schválit kampaň a spustit')" :loading="busy === 'approve'" @click="approve" />
      </div>
      <div v-if="s.auto_send" class="flex flex-wrap items-center justify-between gap-3 text-[14px] text-ink-gray-7">
        <span>{{ __('Schválil {0}', [s.approved_by]) }} {{ formatDate(s.approved_at) }}<template v-if="s.plan.count"> · {{ __('naplánováno do {0}', [formatDate(s.plan.last)]) }}</template></span>
        <Button v-if="s.status === 'Běží'" iconLeft="pause" :label="__('Pozastavit odesílání')" @click="pause" />
      </div>
    </template>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { saveFailed } from '@/composables/glToast'
import { formatDate } from '@/utils'
import { Button, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({ campaign: { type: String, required: true } })
const emit = defineEmits(['changed'])

const KPIS = [
  { key: 'plan', label: __('Naplánováno'), value: (s) => s.plan.count },
  { key: 'sent', label: __('Odesláno'), value: (s) => s.sent },
  { key: 'clicked', label: __('Klikli na ukázku'), value: (s) => s.clicked },
  { key: 'replied', label: __('Odpověděli'), value: (s) => s.replied },
  { key: 'pending', label: __('Čeká na schválení'), value: (s) => s.pending },
]

const state = createResource({ url: 'growupcrm.campaign_agent.get_agent_state', params: { campaign: props.campaign }, auto: true })
const s = computed(() => state.data)
const form = reactive({ sender: '', daily_limit: 30, window_start: 8, window_end: 16, ai_notes: '' })
const dirty = ref(false)
const busy = ref('')
let loading = false

watch(s, (v) => {
  if (!v) return
  loading = true
  Object.assign(form, { sender: v.settings.sender || '', daily_limit: v.settings.daily_limit || 30, window_start: v.settings.window_start || 8,
    window_end: v.settings.window_end || 16, ai_notes: v.settings.ai_notes || '' })
  dirty.value = false
  setTimeout(() => (loading = false))
})
watch(form, () => { if (!loading) dirty.value = true })

async function run(kind, method, params, ok) {
  busy.value = kind
  try {
    const res = await call(`growupcrm.campaign_agent.${method}`, { campaign: props.campaign, ...params })
    if (ok) toast.success(ok(res))
    if (method === 'save_settings') state.data = res
    else state.reload()
    emit('changed')
    return res
  } catch (e) {
    saveFailed(e, () => run(kind, method, params, ok))
  } finally {
    busy.value = ''
  }
}

const save = () => run('save', 'save_settings', { data: JSON.stringify(form) }, () => __('Uloženo'))
async function prepare(redo) {
  if (dirty.value) await save()
  run('prepare', 'prepare', { redo }, (r) => __('Agent píše e-maily pro {0} kontaktů', [r.queued]))
}
async function approve() {
  if (dirty.value) await save()
  run('approve', 'approve_campaign', {}, (r) => __('Naplánováno {0} e-mailů, první odejde {1}', [r.scheduled, formatDate(r.first)]))
}
const pause = () => run('pause', 'pause_campaign', {}, () => __('Odesílání je pozastavené'))

// dokud agent píše, obnovujeme stav
const timer = setInterval(() => s.value?.ai?.queued && state.reload(), 6000)
onBeforeUnmount(() => clearInterval(timer))
</script>
