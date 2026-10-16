<template>
  <!-- GrowUp: Agent – Naše firma (growupcrm.company): profil a oborové ukázky z našeho webu pro oslovování -->
  <div class="gl-card flex flex-col gap-4 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-[18px] font-bold text-ink-gray-9">{{ __('Naše firma') }}</h3>
        <p class="mt-1 text-[14px] text-ink-gray-6">{{ __('Služby, ceny a oborové ukázky z našeho webu. Agent z nich bere argumenty a čísla pro oslovení firem podle oboru.') }}</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="website" class="h-9 w-[260px] rounded-[10px] border border-[rgba(110,120,200,.25)] bg-white/70 px-3 text-[14px] outline-none" :placeholder="__('https://…')" />
        <Button variant="solid" :label="busySync ? __('Načítám…') : __('Načíst z webu')" :loading="busySync" @click="startSync" />
      </div>
    </div>

    <div v-if="p" class="text-[13px] text-ink-gray-5">
      <template v-if="p.last_sync">{{ __('Načteno') }} {{ formatDate(p.last_sync) }}<template v-if="p.sync_credits"> · {{ p.sync_credits }} {{ __('kreditů') }}</template></template>
      <template v-if="p.sync_status && p.sync_status !== 'Hotovo'"> · {{ p.sync_status }}</template>
    </div>

    <template v-if="p?.summary">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div v-for="f in FIELDS" v-show="p[f.key]" :key="f.key" class="rounded-[14px] bg-[rgba(110,120,200,.06)] px-3 py-2">
          <div class="text-[12px] font-semibold uppercase tracking-wide text-ink-gray-5">{{ f.label }}</div>
          <div class="whitespace-pre-line text-[14px] leading-snug text-ink-gray-8">{{ p[f.key] }}</div>
        </div>
      </div>

      <div v-if="p.uncovered?.length" class="rounded-[14px] bg-[rgba(214,130,20,.1)] px-4 py-3 text-[14px] text-[#8a4b00]">
        <b>{{ __('Obory bez ukázky:') }}</b>
        {{ p.uncovered.map((u) => `${u.industry} (${u.count})`).join(', ') }}.
        {{ __('Firmám z nich agent pošle jen obecný profil. Přiřaďte je k ukázce níže nebo doplňte ukázku na web.') }}
      </div>

      <h4 class="text-[15px] font-bold text-ink-gray-9">{{ __('Oborové ukázky') }}</h4>
      <div v-for="(pitch, i) in pitches" :key="pitch.url || i" class="rounded-[16px] border border-[rgba(110,120,200,.16)] p-4">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <a :href="pitch.url" target="_blank" class="text-[15px] font-bold text-ink-gray-9 hover:underline">{{ pitch.obor }}</a>
          <span class="text-[13px] text-ink-gray-5">{{ pitch.target }}</span>
        </div>
        <div class="mt-2 flex flex-wrap gap-1.5">
          <button v-for="ind in p.industries" :key="ind" class="rounded-full px-3 py-1 text-[12px] font-semibold"
            :class="has(pitch, ind) ? 'bg-[#0e1330] text-white' : 'bg-[rgba(79,70,229,.08)] text-[#3b30b8]'" @click="toggle(pitch, ind)">{{ ind }}</button>
        </div>
        <div v-if="pitch.hook" class="mt-2 text-[14px] italic text-ink-gray-8">„{{ pitch.hook }}“</div>
        <details class="mt-2 text-[13px] text-ink-gray-7">
          <summary class="cursor-pointer text-ink-gray-5">{{ __('Bolesti, data z trhu, výsledky') }}</summary>
          <div v-for="f in PITCH_FIELDS" v-show="pitch[f.key]" :key="f.key" class="mt-2">
            <div class="font-semibold text-ink-gray-6">{{ f.label }}</div>
            <div class="whitespace-pre-line">{{ pitch[f.key] }}</div>
          </div>
        </details>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="solid" :label="__('Uložit přiřazení oborů')" :loading="saving" :disabled="!dirty" @click="save" />
        <a href="/app/growup-company-profile" target="_blank" class="text-[13px] text-ink-gray-5 hover:underline">{{ __('Upravit texty') }} ↗</a>
      </div>
    </template>
    <GlEmptyState v-else-if="p" icon="star" :title="__('Profil zatím není načtený')" :text="__('Agent projde náš web a načte služby, ceny a oborové ukázky (asi 50 kreditů).')" />
  </div>
</template>

<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import { saveFailed } from '@/composables/glToast'
import { formatDate } from '@/utils'
import { Button, call, createResource, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const FIELDS = [
  { key: 'summary', label: __('Kdo jsme') },
  { key: 'services', label: __('Služby') },
  { key: 'pricing', label: __('Cena') },
  { key: 'how_we_work', label: __('Jak spolupráce probíhá') },
  { key: 'guarantees', label: __('Záruky a podmínky') },
  { key: 'proof', label: __('Čísla a reference') },
]
const PITCH_FIELDS = [
  { key: 'pains', label: __('Bolesti oboru') },
  { key: 'market_data', label: __('Data z trhu') },
  { key: 'approach', label: __('Co uděláme') },
  { key: 'results', label: __('Výsledky') },
  { key: 'ad_examples', label: __('Ukázky reklam') },
  { key: 'tips', label: __('Co zvládnou sami') },
]

const profile = createResource({ url: 'growupcrm.company.get_profile', auto: true })
const p = computed(() => profile.data)
const website = ref('')
const pitches = ref([])
const dirty = ref(false)
const saving = ref(false)
const busySync = computed(() => ['Čeká', 'Probíhá'].includes(p.value?.sync_status))

watch(p, (v) => {
  if (!v) return
  website.value = v.website
  pitches.value = (v.pitches || []).map((x) => ({ ...x }))
  dirty.value = false
})

const list = (pitch) => (pitch.crm_industries || '').split(',').map((s) => s.trim()).filter(Boolean)
const has = (pitch, ind) => list(pitch).includes(ind)
function toggle(pitch, ind) {
  const current = list(pitch)
  pitch.crm_industries = (current.includes(ind) ? current.filter((x) => x !== ind) : [...current, ind]).join(', ')
  dirty.value = true
}

async function save() {
  saving.value = true
  try {
    profile.data = await call('growupcrm.company.save_profile', { data: JSON.stringify({ pitches: pitches.value }) })
    toast.success(__('Uloženo'))
  } catch (e) {
    saveFailed(e, save)
  } finally {
    saving.value = false
  }
}

async function startSync() {
  try {
    await call('growupcrm.company.start_sync', { website: website.value })
    toast.success(__('Agent načítá náš web, trvá to asi minutu'))
    profile.reload()
  } catch (e) {
    saveFailed(e, startSync)
  }
}

const timer = setInterval(() => busySync.value && profile.reload(), 6000)
onBeforeUnmount(() => clearInterval(timer))
</script>
