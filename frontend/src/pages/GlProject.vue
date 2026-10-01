<template>
  <!-- GrowUp: detail projektu. Data: growupcrm.projects.get_project; úkoly = CRM Task s polem project -->
  <LayoutHeader>
    <template #left-header>
      <div class="flex min-w-0 items-center gap-2">
        <router-link :to="{ name: 'Projects' }" class="text-lg-medium shrink-0 text-ink-gray-5 hover:text-ink-gray-9">{{ __('Projekty') }}</router-link>
        <span class="text-ink-gray-4">/</span>
        <span class="text-lg-medium truncate text-ink-gray-9">{{ p?.project_name }}</span>
      </div>
    </template>
    <template #right-header>
      <Dropdown v-if="p" :options="statusOptions">
        <Button :label="__(p.status)" iconRight="chevron-down">
          <template #prefix><span class="size-2 rounded-full" :style="{ background: STATUS_COLORS[p.display_status] }" /></template>
        </Button>
      </Dropdown>
    </template>
  </LayoutHeader>

  <div v-if="project.error" class="px-4 py-10 text-center text-ink-gray-5">{{ project.error.messages?.[0] || __('Projekt se nepodařilo načíst.') }}</div>
  <div v-else-if="p" class="flex min-h-0 flex-1 gap-3 overflow-hidden px-2 pb-2">
    <div class="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div class="gl-card p-6">
        <div class="flex items-start justify-between gap-6">
          <div class="min-w-0">
            <div class="flex items-center gap-2 text-[13px] font-medium text-ink-gray-7">
              <span class="size-2 rounded-full" :style="{ background: STATUS_COLORS[p.display_status] }" />{{ __(p.display_status) }}
            </div>
            <h1 class="mt-1 truncate text-[30px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ p.project_name }}</h1>
            <div class="mt-1 truncate text-[16px] text-ink-gray-7">
              <router-link v-if="p.organization" :to="{ name: 'Organization', params: { organizationId: p.organization } }" class="hover:text-ink-gray-9">{{ p.organization_name }}</router-link>
              <template v-if="p.lead"> · <router-link :to="{ name: 'Lead', params: { leadId: p.lead } }" class="hover:text-ink-gray-9">{{ p.lead_title }}</router-link></template>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-[13px] text-ink-gray-5">{{ __('Termín') }}</div>
            <div class="num text-[26px] font-bold" :class="p.display_status === 'Zpožděno' ? 'text-[#c8321f]' : 'text-ink-gray-9'">{{ p.deadline ? fullDate(p.deadline) : __('Bez termínu') }}</div>
          </div>
        </div>
        <div class="mt-5 flex items-center gap-3">
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]">
            <div class="h-full rounded-full bg-[#4f46e5] transition-all duration-500" :style="{ width: `${progress}%` }" />
          </div>
          <span class="num text-[15px] font-bold text-ink-gray-9">{{ progress }} %</span>
          <span class="text-[13px] text-ink-gray-5">{{ doneCount }} / {{ p.tasks.length }} {{ __('úkolů') }}</span>
        </div>
        <div v-if="p.status === 'Čeká' && p.waiting_note" class="mt-4 flex items-center gap-3 rounded-[18px] bg-[rgba(224,161,0,.14)] px-4 py-3 text-[#915200]">
          <GlIcon name="clock" :size="20" />
          <span class="text-[15px] font-semibold">{{ __('Čekáme') }}: {{ p.waiting_note }}<template v-if="p.waiting_since"> ({{ __('od') }} {{ fullDate(p.waiting_since) }})</template></span>
        </div>
      </div>

      <div class="gl-card p-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Úkoly') }}</h2>
        </div>
        <div v-for="g in groups" :key="g.phase" class="mb-4">
          <div v-if="g.phase" class="mb-1 text-[12px] font-bold uppercase tracking-wide text-ink-gray-5">{{ g.phase }}</div>
          <div v-for="t in g.tasks" :key="t.name" class="flex items-center gap-3 rounded-2xl px-1 py-2 hover:bg-white/50">
            <button
              class="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.75px] transition"
              :class="t.status === 'Done' ? 'border-[#4f46e5] bg-[#4f46e5] text-white' : 'border-[rgba(110,120,200,.45)] hover:border-[#4f46e5]'"
              :aria-label="t.status === 'Done' ? __('Vrátit mezi otevřené') : __('Označit jako hotové')"
              @click="toggleTask(t)"
            >
              <GlIcon v-if="t.status === 'Done'" name="check" :size="14" />
            </button>
            <span class="min-w-0 flex-1 truncate text-[15px]" :class="t.status === 'Done' ? 'text-ink-gray-5 line-through' : 'font-medium text-ink-gray-9'">{{ t.title }}</span>
            <span v-if="t.due_date" class="num shrink-0 text-[13px]" :class="isOverdue(t) ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-5'">{{ shortDate(t.due_date) }}</span>
            <span v-if="t.assigned_to" class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2e4bb8]" :title="userName(t.assigned_to)">
              {{ initials(userName(t.assigned_to)) }}
            </span>
          </div>
        </div>
        <form class="mt-2 flex items-center gap-2" @submit.prevent="addTask">
          <input v-model="newTitle" class="h-10 flex-1 px-3 text-[14px]" :placeholder="__('Nový úkol…')" />
          <input v-model="newDue" type="date" class="h-10 w-40 px-3 text-[14px]" />
          <Button type="submit" variant="solid" iconLeft="plus" :label="__('Přidat')" :disabled="!newTitle.trim()" />
        </form>
      </div>
    </div>

    <div class="hidden w-[320px] shrink-0 flex-col gap-3 overflow-y-auto lg:flex">
      <div class="gl-card p-6">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Detaily') }}</h2>
        <dl class="flex flex-col">
          <div v-for="r in details" :key="r.label" class="flex items-baseline justify-between gap-4 py-[7px]">
            <dt class="shrink-0 text-[14px] text-ink-gray-5">{{ r.label }}</dt>
            <dd class="min-w-0 truncate text-right text-[14px] font-medium text-ink-gray-9">
              <template v-if="r.value">{{ r.value }}</template>
              <span v-else class="gl-empty">{{ __('Bez hodnoty') }}</span>
            </dd>
          </div>
        </dl>
      </div>
      <div class="gl-card p-6">
        <h2 class="mb-3 text-[20px] font-bold tracking-tight text-ink-gray-9">{{ __('Tým') }}</h2>
        <div v-for="m in p.team" :key="m.user" class="flex items-center gap-3 py-1.5">
          <span class="flex size-9 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2e4bb8]">{{ initials(userName(m.user)) }}</span>
          <span class="text-[14px] text-ink-gray-9">{{ userName(m.user) }}</span>
          <span v-if="m.user === p.project_owner" class="ml-auto text-[12px] text-ink-gray-5">{{ __('vlastník') }}</span>
        </div>
      </div>
    </div>
  </div>

  <Dialog v-model:open="showWaiting" :title="__('Projekt čeká')">
    <template #default>
      <FormControl v-model="waitingNote" type="text" :label="__('Na co čekáme?')" :placeholder="__('Např. podklady od klienta')" />
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showWaiting = false" />
        <Button variant="solid" :label="__('Uložit')" @click="setStatus('Čeká', waitingNote)" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { usersStore } from '@/stores/users'
import { Button, Dialog, Dropdown, FormControl, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, h, ref } from 'vue'

const props = defineProps({ projectId: { type: String, required: true } })
const { getUser } = usersStore()

const project = createResource({ url: 'growupcrm.projects.get_project', params: { name: props.projectId }, auto: true })
const p = computed(() => project.data)
usePageMeta(() => ({ title: p.value?.project_name || __('Projekt') }))

const STATUS_COLORS = { 'Probíhá': '#3b82f6', 'Průběžně': '#8b5cf6', 'Zpožděno': '#e5484d', 'Čeká': '#9ca3af', 'Dokončeno': '#22b35e', 'Zrušeno': '#9ca3af' }
const STATUSES = ['Čeká', 'Probíhá', 'Průběžně', 'Dokončeno', 'Zrušeno']

const doneCount = computed(() => (p.value?.tasks || []).filter((t) => t.status === 'Done').length)
const progress = computed(() => {
  const all = (p.value?.tasks || []).filter((t) => t.status !== 'Canceled').length
  return all ? Math.round((doneCount.value * 100) / all) : 0
})
const groups = computed(() => {
  const out = []
  for (const t of p.value?.tasks || []) {
    const phase = t.project_phase || ''
    let g = out.find((x) => x.phase === phase)
    if (!g) out.push((g = { phase, tasks: [] }))
    g.tasks.push(t)
  }
  return out
})

const statusOptions = computed(() =>
  STATUSES.map((s) => ({
    label: __(s),
    icon: () => h('span', { class: 'size-2 rounded-full', style: { background: STATUS_COLORS[s] } }),
    onClick: () => (s === 'Čeká' ? ((waitingNote.value = p.value.waiting_note || ''), (showWaiting.value = true)) : setStatus(s)),
  })),
)
const showWaiting = ref(false)
const waitingNote = ref('')
async function setStatus(status, note = null) {
  try {
    await call('growupcrm.projects.set_status', { name: props.projectId, status, waiting_note: note })
    showWaiting.value = false
    project.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

async function toggleTask(t) {
  try {
    if (t.status === 'Done') {
      await call('frappe.client.set_value', { doctype: 'CRM Task', name: t.name, fieldname: 'status', value: 'Todo' })
      project.reload()
    } else {
      t.status = 'Done'
      await completeTaskWithUndo(t.name, t.title, () => project.reload())
    }
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
    project.reload()
  }
}

const newTitle = ref('')
const newDue = ref('')
async function addTask() {
  try {
    await call('growupcrm.projects.add_task', { project: props.projectId, title: newTitle.value.trim(), due_date: newDue.value || null })
    newTitle.value = ''
    newDue.value = ''
    project.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

const details = computed(() => [
  { label: __('Šablona'), value: p.value.template ? __(p.value.template) : '' },
  { label: __('Začátek'), value: p.value.start_date ? fullDate(p.value.start_date) : '' },
  { label: __('Termín'), value: p.value.deadline ? fullDate(p.value.deadline) : '' },
  { label: __('Vlastník'), value: p.value.project_owner ? userName(p.value.project_owner) : '' },
  { label: __('Další krok'), value: p.value.next_step || '' },
])

const userName = (u) => getUser(u)?.full_name || u
const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
const toDate = (s) => new Date(String(s).length === 10 ? `${s}T00:00` : String(s).replace(' ', 'T'))
const fullDate = (s) => toDate(s).toLocaleDateString('cs-CZ')
const shortDate = (s) => {
  const d = toDate(s)
  return `${d.getDate()}. ${d.getMonth() + 1}.`
}
const isOverdue = (t) => t.status !== 'Done' && t.due_date && toDate(t.due_date) < new Date()
</script>
