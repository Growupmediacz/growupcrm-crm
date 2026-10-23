<template>
  <!-- GrowUp: Agent, etapa 2b – dohledání ověřených e-mailů přes Anymailfinder (growupcrm.email_finder).
       Výsledky jsou návrhy kontaktů (zdroj Anymailfinder, ověřeno), po dokončení emituje „done“. -->
  <div class="gl-card flex flex-col gap-4 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="flex items-center gap-2 text-[18px] font-bold text-ink-gray-9"><GlIcon name="mail" :size="18" />{{ __('Dohledání e-mailů') }}</h3>
        <p class="mt-1 max-w-[640px] text-[14px] text-ink-gray-6">
          {{ __('U firem s jen obecným nebo žádným e-mailem dohledá Anymailfinder ověřený e-mail jednatele nebo lidí z webu, a když je nezná, rozhodující osobu (majitel, obchod, marketing). Výsledky přibudou do návrhů kontaktů. Platí se jen nalezené e-maily: 1 kredit podle jména, 2 za rozhodující osobu.') }}
        </p>
      </div>
      <div v-if="st" class="text-right">
        <div class="num text-[26px] font-bold text-ink-gray-9">{{ st.credits_used }}<span class="text-[16px] font-medium text-ink-gray-5"> / {{ st.credits_cap }}</span></div>
        <div class="text-[13px] text-ink-gray-5">{{ __('kreditů tento měsíc') }}</div>
        <div v-if="st.account_credits !== null" class="text-[12px] text-ink-gray-5">{{ __('na účtu {0}', [st.account_credits]) }}</div>
      </div>
    </div>

    <div v-if="st && !st.configured" class="rounded-[14px] bg-[rgba(214,160,29,.12)] px-4 py-2.5 text-[14px] text-ink-gray-8">
      <b>{{ __('Anymailfinder zatím není nastavený.') }}</b> {{ __('Chybí API klíč, obraťte se na správce.') }}
    </div>
    <div v-else-if="st?.account_error" class="rounded-[14px] bg-[rgba(208,54,42,.10)] px-4 py-2.5 text-[14px] text-[#b42318]">{{ st.account_error }}</div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <FormControl type="select" :label="__('Obor')" v-model="filters.industry" :options="opt(industries)" />
      <FormControl type="select" :label="__('Kraj')" v-model="filters.territory" :options="opt(territories)" />
      <FormControl type="select" :label="__('Kontaktní e-mail')" v-model="filters.contact_coverage" :options="[{ label: __('Jen obecný i bez e-mailu'), value: '' }, { label: __('Jen obecný e-mail'), value: 'Jen obecný e-mail' }, { label: __('Bez e-mailu'), value: 'Bez e-mailu' }]" />
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[rgba(110,120,200,.07)] px-4 py-3">
      <div class="text-[14px] text-ink-gray-8">
        <template v-if="est.data">
          <b>{{ est.data.count }}</b> {{ __('firem') }} · {{ __('nejvýš') }} <b>{{ est.data.max_credits }}</b> {{ __('kreditů') }}
          <span class="text-ink-gray-5">· {{ __('zbývá {0} kreditů', [est.data.remaining]) }}</span>
          <span v-if="est.data.max_credits > est.data.remaining" class="ml-1 text-ink-gray-5">· {{ __('spustí se jen {0} firem', [Math.floor(est.data.remaining / 2)]) }}</span>
        </template>
        <span v-else class="text-ink-gray-5">{{ __('Počítám…') }}</span>
      </div>
      <Button variant="solid" :label="st?.queued ? __('Dohledávám ({0})', [st.queued]) : __('Dohledat e-maily')" :loading="busy"
        :disabled="!st?.configured || !est.data?.count || est.data.remaining < 2 || !!st?.queued" @click="start" />
    </div>
    <div v-if="st?.searched" class="text-[13px] text-ink-gray-5">
      {{ __('Prohledáno {0} firem, nalezeno {1} ověřených e-mailů. Firmy se znovu nabídnou po 30 dnech.', [st.searched, st.found]) }}
    </div>

    <div class="flex flex-wrap items-center justify-between gap-3 rounded-[16px] bg-[rgba(110,120,200,.07)] px-4 py-3">
      <div class="text-[14px] text-ink-gray-8">
        <div class="font-semibold">{{ __('Osobní e-maily ve firmě') }}</div>
        <div class="text-[13px] text-ink-gray-6">{{ __('U firem bez e-mailu na jednatele vypíše osobní adresy na doméně. Adresa jednatele ho doplní, ostatní lidé přibudou jako návrhy. 1 kredit za firmu, jen když něco najde.') }}</div>
        <template v-if="estCompany.data">
          <b>{{ estCompany.data.count }}</b> {{ __('firem') }} · {{ __('nejvýš') }} <b>{{ estCompany.data.max_credits }}</b> {{ __('kreditů') }}
        </template>
      </div>
      <Button variant="subtle" :label="st?.queued_company ? __('Hledám ({0})', [st.queued_company]) : __('Najít osobní e-maily')" :loading="busyCompany"
        :disabled="!st?.configured || !estCompany.data?.count || estCompany.data.remaining < 1 || !!st?.queued_company" @click="startCompany" />
    </div>
    <div v-if="st?.searched_company" class="text-[13px] text-ink-gray-5">
      {{ __('Prohledáno {0} firem, osobní e-maily u {1} z nich.', [st.searched_company, st.found_company]) }}
    </div>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { saveFailed } from '@/composables/glToast'
import { Button, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'

defineProps({ industries: { type: Array, default: () => [] }, territories: { type: Array, default: () => [] } })
const emit = defineEmits(['done'])

const state = createResource({ url: 'growupcrm.email_finder.get_overview', auto: true })
const st = computed(() => state.data)
const est = createResource({ url: 'growupcrm.email_finder.estimate' })
const filters = reactive({ industry: '', territory: '', contact_coverage: '' })
const estCompany = createResource({ url: 'growupcrm.email_finder.estimate_company' })
const busy = ref(false)
const busyCompany = ref(false)
const opt = (list) => [{ label: __('Vše'), value: '' }, ...(list || []).map((v) => ({ label: v, value: v }))]

watch(filters, () => {
  est.submit({ filters: JSON.stringify(filters) })
  estCompany.submit({ filters: JSON.stringify(filters) })
}, { immediate: true, deep: true })

// během dohledávání obnovujeme; po doběhnutí přepočítáme odhad a dáme vědět návrhům kontaktů
watch(() => (st.value?.queued || 0) + (st.value?.queued_company || 0), (now, before) => {
  if (before && !now) {
    est.reload()
    estCompany.reload()
    emit('done')
  }
})
const timer = setInterval(() => (st.value?.queued || st.value?.queued_company) && state.reload(), 8000)
onBeforeUnmount(() => clearInterval(timer))

async function start() {
  busy.value = true
  try {
    const res = await call('growupcrm.email_finder.start', { filters: JSON.stringify(filters) })
    toast.success(__('Agent dohledá e-maily u {0} firem', [res.queued]))
    state.reload()
  } catch (e) {
    saveFailed(e, start, __('Spuštění se nepovedlo'))
  } finally {
    busy.value = false
  }
}

async function startCompany() {
  busyCompany.value = true
  try {
    const res = await call('growupcrm.email_finder.start_company', { filters: JSON.stringify(filters) })
    toast.success(__('Agent hledá osobní e-maily u {0} firem', [res.queued]))
    state.reload()
  } catch (e) {
    saveFailed(e, startCompany, __('Spuštění se nepovedlo'))
  } finally {
    busyCompany.value = false
  }
}
</script>
