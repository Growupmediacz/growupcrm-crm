<template>
  <!-- GrowUp: karta „Z webu“ na Firmě – profil od agenta (growupcrm.research, Firecrawl) -->
  <div v-if="data && (data.profile.web_status || data.can_run)" class="gl-card mt-3 flex flex-col gap-3 p-4">
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 text-[15px] font-bold text-ink-gray-9"><GlIcon name="sparkles" :size="17" class="text-[#5b5bf6]" />{{ __('Z webu') }}</div>
      <Button v-if="data.can_run" size="sm" :label="running ? __('Agent pracuje…') : p.web_status === 'Obohaceno' ? __('Aktualizovat') : __('Obohatit')" :loading="starting" :disabled="running" @click="start" />
    </div>

    <p v-if="!p.web_status && !running" class="text-[13px] text-ink-gray-6">{{ __('Agent projde web firmy a doplní, čím se zabývá, služby a návrh úvodní věty do e-mailu.') }}</p>
    <p v-if="p.web_status === 'Bez webu'" class="text-[13px] text-ink-gray-6">{{ __('Firma nemá vyplněný web.') }}</p>
    <p v-if="data.run?.status === 'Chyba'" class="text-[13px] text-[#a82614]">{{ data.run.error }}</p>

    <template v-if="p.web_status === 'Obohaceno'">
      <div v-for="f in FIELDS" v-show="p[f.key]" :key="f.key">
        <div class="text-[12px] font-semibold uppercase tracking-wide text-ink-gray-5">{{ f.label }}</div>
        <div class="text-[14px] leading-snug text-ink-gray-8">{{ p[f.key] }}</div>
      </div>
      <div v-if="p.web_opener" class="rounded-[14px] bg-[rgba(91,91,246,.07)] px-3 py-2">
        <div class="text-[12px] font-semibold uppercase tracking-wide text-[#4644d9]">{{ __('Úvodní věta do e-mailu') }}</div>
        <div class="text-[14px] italic leading-snug text-ink-gray-9">„{{ p.web_opener }}“</div>
      </div>
      <div v-if="data.people.length">
        <div class="text-[12px] font-semibold uppercase tracking-wide text-ink-gray-5">{{ __('Lidé na webu') }}</div>
        <div v-for="person in data.people" :key="person.name" class="text-[14px] text-ink-gray-8">
          <b>{{ person.name }}</b><span v-if="person.role" class="text-ink-gray-6"> · {{ person.role }}</span>
          <span v-if="person.email" class="text-ink-gray-6"> · {{ person.email }}</span>
        </div>
      </div>
      <div class="text-[12px] text-ink-gray-5">{{ __('Obohaceno') }} {{ formatDate(p.web_enriched_at) }}<template v-if="data.run?.credits"> · {{ data.run.credits }} {{ __('kreditů') }}</template></div>
    </template>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { saveFailed } from '@/composables/glToast'
import { formatDate } from '@/utils'
import { Button, call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({ organization: { type: String, required: true } })
const emit = defineEmits(['updated'])

const FIELDS = [
  { key: 'web_summary', label: __('Čím se zabývá') },
  { key: 'web_services', label: __('Služby') },
  { key: 'web_customers', label: __('Zákazníci') },
  { key: 'web_region', label: __('Působnost') },
  { key: 'web_size', label: __('Velikost') },
  { key: 'web_signals', label: __('Marketing') },
]

const res = createResource({ url: 'growupcrm.research.get_organization', params: { organization: props.organization }, auto: true })
const data = computed(() => res.data)
const p = computed(() => res.data?.profile || {})
const running = computed(() => ['Čeká', 'Probíhá'].includes(res.data?.run?.status))
const starting = ref(false)

let lastStatus = null
const timer = setInterval(() => {
  if (!running.value) return
  res.reload().then(() => {
    if (!running.value && lastStatus !== res.data?.run?.status) emit('updated')
    lastStatus = res.data?.run?.status
  })
}, 6000)
onBeforeUnmount(() => clearInterval(timer))

async function start() {
  starting.value = true
  try {
    await call('growupcrm.research.enrich_organization', { organization: props.organization })
    toast.success(__('Agent prochází web firmy, výsledek se objeví za chvíli'))
    res.reload()
  } catch (e) {
    saveFailed(e, start, __('Spuštění se nepovedlo'))
  } finally {
    starting.value = false
  }
}
</script>
