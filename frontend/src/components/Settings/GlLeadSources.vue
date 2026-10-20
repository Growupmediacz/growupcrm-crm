<template>
  <!-- GrowUp: Zdroje zakázek – přehled napojených zdrojů (growupcrm.lead_sources) + Formuláře a Facebook z CRM v jedné sekci -->
  <div class="flex h-full flex-col">
    <div class="flex flex-col gap-4 px-6 pt-6">
      <div>
        <h2 class="text-2xl-semibold text-ink-gray-8">{{ __('Zdroje zakázek') }}</h2>
        <p class="mt-1 text-p-base text-ink-gray-6">{{ __('Odkud do CRM přicházejí nové zakázky a co je kde napojené.') }}</p>
      </div>
      <div class="flex gap-1.5">
        <button
          v-for="t in TABS"
          :key="t.key"
          type="button"
          class="gl-chip h-9 rounded-full px-3.5 text-[14px]"
          :class="tab === t.key && 'gl-chip-on'"
          @click="tab = t.key"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div v-if="tab === 'overview'" class="flex flex-col gap-3 overflow-y-auto p-6">
      <GlSkeleton v-if="overview.loading && !overview.data" :rows="4" />
      <GlErrorBanner v-else-if="overview.error" :title="__('Přehled se nepodařilo načíst')" @retry="overview.reload()" />
      <div
        v-for="c in overview.data?.channels || []"
        v-else
        :key="c.key"
        class="gl-card flex flex-wrap items-center gap-4 !rounded-[20px] p-4"
      >
        <span class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(110,120,200,.12)] text-[#2440a6]">
          <GlIcon :name="ICONS[c.key] || 'link'" :size="18" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-[15px] font-bold text-ink-gray-9">{{ c.title }}</span>
            <span
              class="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[12px] font-semibold"
              :class="c.connected ? 'bg-[rgba(34,179,94,.12)] text-[#178a4a]' : 'bg-[rgba(110,120,200,.1)] text-ink-gray-6'"
            >
              <span class="size-1.5 rounded-full" :class="c.connected ? 'bg-[#22b35e]' : 'bg-ink-gray-4'" />
              {{ c.connected ? __('Napojeno') : __('Nenapojeno') }}
            </span>
          </div>
          <div class="mt-0.5 truncate text-[13px] text-ink-gray-7">{{ c.detail }}</div>
          <div class="mt-0.5 text-[12px] text-ink-gray-5">{{ c.how }}</div>
        </div>
        <div v-if="c.total !== null" class="text-right">
          <div class="text-[15px] font-bold text-ink-gray-9">{{ __('{0} za 30 dní', [c.last_30]) }}</div>
          <div class="text-[12px] text-ink-gray-5">
            {{ __('celkem {0}', [c.total]) }}<template v-if="c.last"> · {{ __('poslední {0}', [shortDate(c.last)]) }}</template>
          </div>
        </div>
        <Button v-if="c.key === 'forms'" :label="__('Formuláře')" @click="tab = 'forms'" />
        <Button v-else-if="c.key === 'facebook'" :label="c.connected ? __('Spravovat') : __('Napojit')" @click="tab = 'sync'" />
      </div>
    </div>

    <div v-else-if="tab === 'forms'" class="min-h-0 flex-1">
      <FormsSettings />
    </div>
    <div v-else class="min-h-0 flex-1 overflow-y-auto">
      <LeadSyncSourcePage />
    </div>
  </div>
</template>

<script setup>
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import FormsSettings from '@/components/Settings/Forms/FormsSettings.vue'
import LeadSyncSourcePage from '@/components/Settings/LeadSyncing/LeadSyncSourcePage.vue'
import { Button, createResource } from 'frappe-ui'
import { ref, watch } from 'vue'

const TABS = [
  { key: 'overview', label: __('Přehled') },
  { key: 'forms', label: __('Formuláře') },
  { key: 'sync', label: __('Facebook a Instagram') },
]
const ICONS = { web: 'globe', booking: 'cal', forms: 'doc', facebook: 'users', api: 'key' }

const tab = ref('overview')
const overview = createResource({ url: 'growupcrm.lead_sources.get_overview', auto: true })
watch(tab, (t) => t === 'overview' && overview.reload())

const shortDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T'))
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
</script>
