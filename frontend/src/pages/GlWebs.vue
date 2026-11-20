<template>
  <!-- GrowUp: weby klientů podle fáze (POSTUP-WEB.md). Data: growupcrm.webs.board -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-4">
        <span class="gl-page-title text-lg-medium shrink-0 text-ink-gray-9">{{ __('Weby') }}</span>
        <GlNumber v-if="board.data" :value="board.data.webs.length" class="text-[15px] text-ink-gray-5" />
      </div>
    </template>
    <template #right-header>
      <!-- GrowUp (zadání 2027 kolo 2 V2): přepínač Uzavřené jako gl-seg s cílem ≥ 36/44 px -->
      <div class="gl-seg inline-flex" role="group" :aria-label="__('Uzavřené')">
        <button type="button" class="gl-seg-btn min-h-[36px] max-md:min-h-[44px]" :class="showClosed && 'gl-seg-on'" :aria-pressed="showClosed" @click="showClosed = !showClosed">
          {{ __('Uzavřené') }}
        </button>
      </div>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="board.error && isForbidden(board.error)" :message="board.error.messages?.[0]" />
  <div v-else-if="board.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Weby se nepodařilo načíst')" :text="board.error.messages?.[0]" @retry="board.reload()" /></div>
  <div v-else-if="!board.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else-if="!board.data.webs.length" class="px-3 md:px-2">
    <GlEmptyState icon="globe" :title="__('Zatím žádné weby')" :text="__('Weby klientů se objeví tady, jakmile se založí ukázka nebo objednávka.')" />
  </div>
  <div v-else class="flex min-h-0 flex-1 flex-col gap-4 px-3 pb-6 md:flex-row md:items-start md:gap-3 md:overflow-x-auto md:px-2">
    <!-- telefon: fáze pod sebou, prázdné sbalené do jednoho řádku; desktop: sloupce jako Kanban -->
    <p v-if="emptyPhases.length" class="text-[13px] text-ink-gray-5 md:hidden">
      {{ __('Bez webu') }}: {{ emptyPhases.map((c) => `${c.count} ${c.label}`).join(', ') }}
    </p>
    <section
      v-for="(phase, i) in columns"
      :key="phase.name"
      class="gl-card relative flex flex-col gap-3 overflow-hidden p-3 pt-4 md:w-[260px] md:shrink-0"
      :class="!phase.items.length && 'max-md:hidden'"
      :style="{ '--lane': laneColor(i) }"
    >
      <span class="absolute inset-x-0 top-0 h-1.5 bg-[var(--lane)]" aria-hidden="true" />
      <header class="flex items-center justify-between gap-2 px-1">
        <h2 class="min-w-0 truncate text-[16px] font-semibold text-ink-gray-9">{{ phase.name }}</h2>
        <GlNumber :value="phase.items.length" class="text-[14px] text-ink-gray-6" />
      </header>
      <router-link
        v-for="w in phase.items"
        :key="w.name"
        :to="{ name: 'Project', params: { projectId: w.name } }"
        class="block rounded-[16px] border border-outline-gray-1 bg-surface-white p-3 transition-colors duration-[var(--t-fast)] hover:border-[var(--accent-300)]"
      >
        <div class="truncate text-[16px] font-semibold text-ink-gray-9">{{ w.organization_name || w.project_name }}</div>
        <div class="mt-0.5 truncate text-[14px] text-ink-gray-5">{{ w.web_slug }}</div>
        <div v-if="w.status === 'Čeká' && w.waiting_note" class="mt-2 text-[14px] text-[var(--c-amber-700)]">{{ w.waiting_note }}</div>
        <div v-else-if="w.next_step" class="mt-2 line-clamp-2 text-[14px] text-ink-gray-7">{{ w.next_step }}</div>
        <div class="mt-2 flex items-center justify-between gap-2">
          <span class="num text-[13px]" :class="(w.days_in_phase || 0) > 5 ? 'font-semibold text-[var(--overdue)]' : 'text-ink-gray-5'">
            {{ daysLabel(w.days_in_phase) }}
          </span>
          <span class="flex flex-wrap justify-end gap-2" @click.stop>
            <a v-for="l in links(w)" :key="l.key" :href="l.url" target="_blank" rel="noopener" :title="l.title" :aria-label="l.title"
              class="grid size-9 place-items-center rounded-full text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-9 max-md:size-11" @click.stop>
              <GlIcon :name="l.icon" :size="18" />
            </a>
            <button v-if="/^https?:\/\//i.test(w.preview_url || '')" type="button" :title="__('Kopírovat odkaz')" :aria-label="__('Kopírovat odkaz')"
              class="grid size-9 place-items-center rounded-full text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-9 max-md:size-11" @click.prevent.stop="copyLink(w.preview_url)">
              <GlIcon name="copy" :size="18" />
            </button>
          </span>
        </div>
      </router-link>
      <p v-if="!phase.items.length" class="px-1 py-2 text-[13px] text-ink-gray-5">{{ __('Žádný web v této fázi') }}</p>
    </section>
  </div>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlNumber from '@/components/GlNumber.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isForbidden } from '@/utils/glErrors'
import { createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

usePageMeta(() => ({ title: __('Weby') }))

const showClosed = ref(false)
const board = createResource({
  url: 'growupcrm.webs.board',
  makeParams: () => ({ include_closed: showClosed.value ? 1 : 0 }),
  auto: true,
})
watch(showClosed, () => board.reload())

const columns = computed(() =>
  (board.data?.phases || []).map((name) => ({ name, items: board.data.webs.filter((w) => w.web_phase === name) })),
)

const emptyPhases = computed(() => columns.value.filter((c) => !c.items.length).map((c) => {
  const m = c.name.match(/^(\d+)\s+(.*)$/)
  return { count: m ? m[1] : '', label: m ? m[2] : c.name }
}))
const LANES = ['var(--stage-nova)', 'var(--stage-kontaktovano)', 'var(--stage-jednani)', 'var(--stage-nabidka)', 'var(--c-blue-400)', 'var(--c-cyan-500)', 'var(--stage-vyhrano)']
const laneColor = (i) => LANES[i] || 'var(--stage-prohrano)'
async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success(__('Odkaz zkopírován'))
  } catch (e) {
    toast.error(__('Odkaz se nepodařilo zkopírovat'))
  }
}

function links(w) {
  return [
    { key: 'preview', url: w.preview_url, icon: 'eye', title: __('Náhled') },
    { key: 'live', url: w.live_url, icon: 'globe', title: __('Ostrý web') },
    { key: 'repo', url: w.repo_url, icon: 'link', title: __('Repozitář') },
    { key: 'drive', url: w.drive_url, icon: 'folder', title: __('Drive') },
  ].filter((l) => /^https?:\/\//i.test(l.url || '')) // jen http(s): žádné javascript: odkazy
}
function daysLabel(n) {
  if (n == null) return ''
  if (n === 0) return __('ve fázi dnes')
  return n === 1 ? __('1 den ve fázi') : n <= 4 ? __('{0} dny ve fázi', [n]) : __('{0} dní ve fázi', [n])
}
</script>
