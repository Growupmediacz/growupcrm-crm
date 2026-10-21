<template>
  <!-- GrowUp: Agent, etapa 5 – hledání nových firem (growupcrm.discovery): segmenty = oborové ukázky -->
  <div class="gl-card flex flex-col gap-4 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="flex items-center gap-2 text-[18px] font-bold text-ink-gray-9"><GlIcon name="search" :size="18" />{{ __('Hledání nových firem') }}</h3>
        <p class="mt-1 max-w-[640px] text-[14px] text-ink-gray-6">
          {{ __('Agent prohledá web podle oboru a měst, ověří, že jde o firmu z oboru, doplní IČO a adresu z ARES (OSVČ a firmy, které v ARES nejde ověřit, vynechá) a nové firmy rovnou obohatí a připraví návrhy kontaktů. Firmy, které už v CRM jsou, přeskočí.') }}
        </p>
      </div>
      <div v-if="st" class="text-right">
        <div class="num text-[26px] font-bold text-ink-gray-9">{{ st.organizations }}</div>
        <div class="text-[13px] text-ink-gray-5">{{ __('firem v CRM') }}</div>
      </div>
    </div>

    <div v-if="st" class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <label v-for="s in st.segments" :key="s.name" class="flex items-center gap-3 rounded-[14px] bg-[rgba(110,120,200,.06)] px-3 py-2.5">
        <div class="min-w-0 flex-1">
          <div class="text-[14px] font-semibold text-ink-gray-9">{{ s.name }}</div>
          <div class="truncate text-[12px] text-ink-gray-5" :title="s.target">{{ s.target }}</div>
        </div>
        <input v-model.number="targets[s.name]" type="number" min="0" max="300" class="gl-field !h-9 !w-[72px] text-right" :aria-label="__('Počet firem: {0}', [s.name])" />
      </label>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Button variant="solid" :label="__('Najít {0} firem', [total])" :disabled="!total || running" :loading="busy" @click="start" />
      <span class="text-[13px] text-ink-gray-5">{{ __('Odhad: ~{0} kreditů (hledání, ověření webu, obohacení)', [estimate]) }}</span>
    </div>

    <div v-for="r in st?.runs || []" :key="r.name" class="rounded-[16px] border border-[rgba(110,120,200,.16)] p-4">
      <div class="flex flex-wrap items-center gap-3">
        <span class="size-2 rounded-full" :style="{ background: STATUS_COLOR[r.status] }" />
        <b class="text-[14px] text-ink-gray-9">{{ r.status }}</b>
        <span class="text-[13px] text-ink-gray-5">{{ formatDate(r.creation) }}</span>
        <span class="ml-auto text-[13px] text-ink-gray-5">{{ __('{0} nových firem', [r.result.created?.length || 0]) }} · {{ r.credits || 0 }} {{ __('kr.') }}</span>
      </div>
      <div v-if="r.result.stats" class="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        <div v-for="(v, seg) in r.result.stats" :key="seg" class="flex items-center justify-between gap-3 text-[13px]">
          <span class="truncate text-ink-gray-7">{{ seg }}</span>
          <span class="num shrink-0 font-semibold text-ink-gray-9">{{ v.found }} / {{ v.target }} <span class="font-normal text-ink-gray-5">· {{ __('ověřeno {0}', [v.checked]) }}<template v-if="v.osvc || v.unverified"> · {{ __('vyřazeno OSVČ {0}, neověřeno {1}', [v.osvc || 0, v.unverified || 0]) }}</template></span></span>
        </div>
      </div>
      <p v-if="r.error" class="mt-2 text-[13px] text-[#a82614]">{{ r.error }}</p>
      <p v-if="r.result.created?.length" class="mt-2 text-[13px] text-ink-gray-5">{{ __('Nové firmy najdete ve Firmách, segment začíná „Agent:“.') }}</p>
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { formatDateCz } from '@/utils/glDate'
import { Button, call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

const STATUS_COLOR = { 'Čeká': '#a3a8c3', 'Probíhá': 'var(--accent-600)', 'Hotovo': '#22b35e', 'Chyba': '#d0362a' }
const state = createResource({ url: 'growupcrm.discovery.get_state', auto: true })
const st = computed(() => state.data)
const targets = reactive({})
const busy = ref(false)
const total = computed(() => Object.values(targets).reduce((a, n) => a + (Number(n) || 0), 0))
const estimate = computed(() => total.value * (st.value?.credits_per_firm || 26))
const running = computed(() => (st.value?.runs || []).some((r) => ['Čeká', 'Probíhá'].includes(r.status)))
const formatDate = (d) => formatDateCz(new Date(String(d).replace(' ', 'T')))

async function start() {
  busy.value = true
  try {
    const plan = Object.fromEntries(Object.entries(targets).filter(([, n]) => Number(n) > 0))
    await call('growupcrm.discovery.start', { targets: JSON.stringify(plan) })
    toast.success(__('Hledání běží. Firmy přibývají průběžně.'))
    state.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    busy.value = false
  }
}

// během hledání obnovovat průběh
let timer = null
watch(running, (on) => {
  clearInterval(timer)
  if (on) timer = setInterval(() => state.reload(), 15000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))
</script>
