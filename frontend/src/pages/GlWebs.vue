<template>
  <!-- GrowUp: weby klientů podle fáze (POSTUP-WEB.md). Data: growupcrm.webs.board -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-4">
        <span class="gl-page-title text-lg-medium shrink-0 text-ink-gray-9">{{ __('Weby') }}</span>
        <span v-if="board.data" class="num text-[15px] text-ink-gray-5">{{ board.data.webs.length }}</span>
      </div>
    </template>
    <template #right-header>
      <label class="flex cursor-pointer items-center gap-2 text-[14px] text-ink-gray-7">
        <input v-model="showClosed" type="checkbox" class="rounded" />{{ __('Uzavřené') }}
      </label>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="board.error && isForbidden(board.error)" :message="board.error.messages?.[0]" />
  <div v-else-if="board.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Weby se nepodařilo načíst')" :text="board.error.messages?.[0]" @retry="board.reload()" /></div>
  <div v-else-if="!board.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else-if="!board.data.webs.length" class="px-3 md:px-2">
    <GlEmptyState icon="globe" :title="__('Zatím žádné weby')" :text="__('Nový web založí Claude skillem novy-web, objeví se tady ve fázi 0 Ukázka nebo 1 Objednáno.')" />
  </div>
  <div v-else class="flex min-h-0 flex-1 gap-3 overflow-x-auto px-3 pb-6 md:px-2">
    <section v-for="phase in columns" :key="phase.name" class="gl-card flex w-[272px] shrink-0 flex-col gap-2 self-start p-3">
      <header class="flex items-center justify-between px-1 pb-1">
        <span class="text-[14px] font-semibold text-ink-gray-8">{{ phase.name }}</span>
        <span class="num text-[13px] text-ink-gray-5">{{ phase.items.length }}</span>
      </header>
      <router-link
        v-for="w in phase.items"
        :key="w.name"
        :to="{ name: 'Project', params: { projectId: w.name } }"
        class="block rounded-[14px] border border-outline-gray-1 bg-surface-white p-3 transition hover:border-[var(--accent-300)]"
      >
        <div class="truncate text-[15px] font-semibold text-ink-gray-9">{{ w.organization_name || w.project_name }}</div>
        <div class="mt-0.5 truncate text-[12px] text-ink-gray-5">{{ w.web_slug }}</div>
        <div v-if="w.status === 'Čeká' && w.waiting_note" class="mt-2 text-[13px] text-[#9a5b00]">{{ w.waiting_note }}</div>
        <div v-else-if="w.next_step" class="mt-2 line-clamp-2 text-[13px] text-ink-gray-7">{{ w.next_step }}</div>
        <div class="mt-2 flex items-center justify-between">
          <span class="num text-[12px]" :class="(w.days_in_phase || 0) > 5 ? 'font-semibold text-[#a82614]' : 'text-ink-gray-5'">
            {{ daysLabel(w.days_in_phase) }}
          </span>
          <span class="flex gap-1.5" @click.stop>
            <a v-for="l in links(w)" :key="l.key" :href="l.url" target="_blank" rel="noopener" :title="l.title"
              class="grid size-7 place-items-center rounded-full text-ink-gray-6 hover:bg-surface-gray-2 hover:text-ink-gray-9" @click.stop>
              <GlIcon :name="l.icon" :size="15" />
            </a>
          </span>
        </div>
      </router-link>
    </section>
  </div>
</template>

<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { isForbidden } from '@/utils/glErrors'
import { createResource, usePageMeta } from 'frappe-ui'
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
