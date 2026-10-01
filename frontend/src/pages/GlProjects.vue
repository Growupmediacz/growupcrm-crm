<template>
  <!-- GrowUp: modul Projekty (design „Projekty“). Data: growupcrm.projects.get_board -->
  <LayoutHeader>
    <template #left-header>
      <span class="text-lg-medium text-ink-gray-9">{{ __('Projekty') }}</span>
    </template>
    <template #right-header>
      <router-link :to="{ name: 'ProjectTemplates' }" class="hidden sm:inline-flex">
        <Button iconLeft="layout-template" :label="__('Šablony')" />
      </router-link>
      <Popover placement="bottom-end">
        <template #target="{ togglePopover }">
          <Button iconLeft="filter" :class="activeFilters && '!bg-[rgba(79,70,229,.12)] !text-[#4338ca]'" @click="togglePopover()">
            <span class="hidden sm:inline">{{ __('Filtr') }}</span><span v-if="activeFilters"> · {{ activeFilters }}</span>
          </Button>
        </template>
        <template #body="{ close }">
          <div class="gl-sheet mt-2 w-[300px] rounded-[20px] p-4">
            <div class="mb-2 text-[12px] font-bold text-ink-gray-5">{{ __('Stav') }}</div>
            <label v-for="s in FILTER_STATUSES" :key="s" class="flex cursor-pointer items-center gap-2.5 py-1.5 text-[14px]">
              <input v-model="draftStatuses" type="checkbox" :value="s" class="rounded" />
              <span class="size-2 rounded-full" :style="{ background: STATUS_COLORS[s] }" />{{ __(s) }}
            </label>
            <div class="mb-2 mt-3 text-[12px] font-bold text-ink-gray-5">{{ __('Termín') }}</div>
            <div class="gl-seg flex w-full">
              <button v-for="d in DUE" :key="d.value" class="gl-seg-btn flex-1 justify-center !px-2" :class="draftDue === d.value && 'gl-seg-on'" @click="draftDue = d.value">
                {{ d.label }}
              </button>
            </div>
            <div class="mt-4 flex gap-2">
              <Button class="flex-1" :label="__('Vymazat')" @click="clearFilters(close)" />
              <Button class="flex-1" variant="solid" :label="__('Použít')" @click="applyFilters(close)" />
            </div>
          </div>
        </template>
      </Popover>
      <Button variant="solid" iconLeft="plus" @click="showNew = true">
        <span class="hidden sm:inline">{{ __('Nový projekt') }}</span>
      </Button>
    </template>
  </LayoutHeader>

  <GlForbidden v-if="board.error && isForbidden(board.error)" :message="board.error.messages?.[0]" />
  <div v-else-if="board.error" class="px-3 md:px-2"><GlErrorBanner :title="__('Projekty se nepodařilo načíst')" :text="board.error.messages?.[0]" @retry="board.reload()" /></div>
  <div v-else-if="!board.data" class="px-3 md:px-2"><GlSkeleton :rows="5" /></div>
  <div v-else class="flex flex-col gap-4 overflow-y-auto px-3 pb-6 md:px-2">
    <div class="gl-seg self-start">
      <button v-for="t in TABS" :key="t.value" class="gl-seg-btn" :class="tab === t.value && 'gl-seg-on'" @click="tab = t.value">
        {{ t.label }} <span class="num opacity-70">{{ board.data?.counts?.[t.value] ?? '' }}</span>
      </button>
    </div>

    <div class="gl-card overflow-x-auto p-2">
      <table class="w-full min-w-[720px] text-left text-[14px]">
        <thead class="text-[12px] font-bold text-ink-gray-5">
          <tr>
            <th class="px-3 py-2">{{ __('Projekt') }}</th>
            <th class="px-3 py-2">{{ __('Stav') }}</th>
            <th class="w-[220px] px-3 py-2">{{ __('Postup') }}</th>
            <th class="px-3 py-2">{{ __('Termín') }}</th>
            <th class="px-3 py-2">{{ __('Tým') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in board.data?.projects || []"
            :key="p.name"
            class="cursor-pointer border-t border-[rgba(110,120,200,.12)] hover:bg-white/50"
            @click="router.push({ name: 'Project', params: { projectId: p.name } })"
          >
            <td class="px-3 py-3">
              <div class="font-bold text-ink-gray-9">{{ p.project_name }}</div>
              <div class="truncate text-[12.5px] text-ink-gray-5">{{ subline(p) }}</div>
            </td>
            <td class="px-3 py-3">
              <span class="flex items-center gap-1.5 whitespace-nowrap">
                <span class="size-2 rounded-full" :style="{ background: STATUS_COLORS[p.display_status] }" />{{ statusLabel(p) }}
              </span>
            </td>
            <td class="px-3 py-3">
              <div class="flex items-center gap-3">
                <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]">
                  <div class="h-full rounded-full bg-[#4f46e5]" :style="{ width: `${p.progress || 0}%` }" />
                </div>
                <span class="num w-10 text-right text-[13px] font-bold text-ink-gray-9">{{ Math.round(p.progress || 0) }} %</span>
              </div>
            </td>
            <td class="num whitespace-nowrap px-3 py-3" :class="p.display_status === 'Zpožděno' ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-7'">
              {{ p.deadline ? shortDate(p.deadline) : '' }}
            </td>
            <td class="px-3 py-3">
              <span class="flex -space-x-1.5">
                <span v-for="u in p.team.slice(0, 4)" :key="u" class="flex size-7 items-center justify-center rounded-full border-2 border-white bg-[#dde6ff] text-[10px] font-bold text-[#2e4bb8]" :title="userName(u)">
                  {{ initials(userName(u)) }}
                </span>
              </span>
            </td>
          </tr>
          <tr v-if="board.data && !board.data.projects.length">
            <td colspan="5" class="px-3 py-10 text-center text-ink-gray-5">{{ __('Žádné projekty.') }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid gap-4 lg:grid-cols-3">
      <div class="gl-card p-5">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Tento týden') }}</h2>
        <GlEmptyState v-if="!board.data?.week?.length" icon="cal" :title="__('Na tento týden nic')" :text="__('Úkoly s termínem v tomto týdnu se ukážou tady.')" />
        <div v-for="(w, i) in board.data?.week || []" :key="i" class="flex items-center gap-3 py-2">
          <span class="w-7 text-[14px] font-bold text-ink-gray-9">{{ dayShort(w.at) }}</span>
          <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="w.kind === 'task' ? 'bg-[rgba(224,161,0,.16)] text-[#915200]' : 'bg-[rgba(59,110,246,.14)] text-[#2e5bd8]'">
            <GlIcon :name="w.kind === 'task' ? 'check' : 'cal'" :size="18" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[15px] font-semibold text-ink-gray-9">{{ w.title }}</span>
            <span class="block truncate text-[12.5px] text-ink-gray-5">{{ w.organization }}</span>
          </span>
          <span class="text-[12.5px] text-ink-gray-5">{{ w.kind === 'task' ? __('Úkol') : __('Schůzka') }}</span>
        </div>
      </div>

      <div class="gl-card p-5">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Vytížení týmu') }}</h2>
        <GlEmptyState v-if="!board.data?.load?.length" icon="check" :title="__('Žádné otevřené úkoly')" :text="__('Tým nemá žádnou rozdělanou práci.')" />
        <div v-for="l in board.data?.load || []" :key="l.user" class="flex items-center gap-3 py-2">
          <span class="flex size-9 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2e4bb8]">{{ initials(userName(l.user)) }}</span>
          <span class="w-32 truncate text-[14px] text-ink-gray-9">{{ userName(l.user) }}</span>
          <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]">
            <div class="h-full rounded-full" :class="l.percent > 100 ? 'bg-[#e5484d]' : 'bg-[#4f46e5]'" :style="{ width: `${Math.min(l.percent, 100)}%` }" />
          </div>
          <span class="num w-12 text-right text-[13px] text-ink-gray-5" :title="__('{0} úkolů na 7 dní', [l.tasks])">{{ l.percent }} %</span>
        </div>
        <div class="mt-2 text-[11.5px] text-ink-gray-4">{{ __('Otevřené úkoly projektů na příštích 7 dní, 10 úkolů = 100 %.') }}</div>
      </div>

      <div class="gl-card p-5">
        <h2 class="mb-2 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Po termínu') }}</h2>
        <template v-if="board.data?.overdue?.length">
          <div class="text-[34px] font-bold tracking-tight text-[#c8321f]">{{ overdueLabel }}</div>
          <div v-for="p in board.data.overdue.slice(0, 2)" :key="p.name" class="mt-1 text-[14px] text-ink-gray-7">
            <router-link :to="{ name: 'Project', params: { projectId: p.name } }" class="font-semibold hover:text-[#4f46e5]">{{ p.project_name }}</router-link>
            – {{ p.organization_name }}<template v-if="p.waiting_note">. {{ p.waiting_note }}</template>
          </div>
        </template>
        <div v-else class="text-[14px] text-ink-gray-5">{{ __('Nic není po termínu.') }}</div>
      </div>
    </div>
  </div>

  <GlNewProjectModal v-if="showNew" v-model="showNew" @saved="(p) => router.push({ name: 'Project', params: { projectId: p } })" />
</template>
<script setup>
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import GlErrorBanner from '@/components/GlErrorBanner.vue'
import { isForbidden } from '@/utils/glErrors'
import GlForbidden from '@/components/GlForbidden.vue'
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlNewProjectModal from '@/components/Modals/GlNewProjectModal.vue'
import { usersStore } from '@/stores/users'
import { Button, Popover, createResource, usePageMeta } from 'frappe-ui'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

usePageMeta(() => ({ title: __('Projekty') }))
const router = useRouter()
const { getUser } = usersStore()

const TABS = [
  { value: 'active', label: __('Aktivní') },
  { value: 'waiting', label: __('Čeká') },
  { value: 'done', label: __('Dokončené') },
]
const FILTER_STATUSES = ['Probíhá', 'Průběžně', 'Zpožděno', 'Čeká']
const DUE = [
  { value: '', label: __('Vše') },
  { value: 'month', label: __('Měsíc') },
  { value: 'overdue', label: __('Po termínu') },
]
const STATUS_COLORS = {
  'Probíhá': '#3b82f6',
  'Průběžně': '#8b5cf6',
  'Zpožděno': '#e5484d',
  'Čeká': '#9ca3af',
  'Dokončeno': '#22b35e',
  'Zrušeno': '#9ca3af',
}

const tab = ref('active')
const statuses = ref([])
const due = ref('')
const draftStatuses = ref([])
const draftDue = ref('')
const showNew = ref(false)

const board = createResource({
  url: 'growupcrm.projects.get_board',
  makeParams: () => ({ tab: tab.value, statuses: statuses.value, due: due.value }),
  auto: true,
})
watch([tab, statuses, due], () => board.reload())

const activeFilters = computed(() => statuses.value.length + (due.value ? 1 : 0))
function applyFilters(close) {
  statuses.value = [...draftStatuses.value]
  due.value = draftDue.value
  close()
}
function clearFilters(close) {
  draftStatuses.value = []
  draftDue.value = ''
  applyFilters(close)
}

const statusLabel = (p) => (p.status === 'Čeká' && p.waiting_note ? __('Čeká') : __(p.display_status))
function subline(p) {
  const parts = [p.organization_name]
  if (p.status === 'Čeká' && p.waiting_note) parts.push(p.waiting_note)
  else if (p.next_step) parts.push(`${__('Další')}: ${p.next_step}`)
  return parts.filter(Boolean).join(' · ')
}
const overdueLabel = computed(() => {
  const n = board.data?.overdue?.length || 0
  return n === 1 ? __('1 projekt') : n <= 4 ? __('{0} projekty', [n]) : __('{0} projektů', [n])
})
const userName = (u) => getUser(u)?.full_name || u
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
const shortDate = (s) => {
  const d = new Date(String(s).replace(' ', 'T') + (String(s).length === 10 ? 'T00:00' : ''))
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
const dayShort = (s) => {
  const t = new Date(String(s).replace(' ', 'T')).toLocaleDateString('cs-CZ', { weekday: 'short' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
</script>
