<template>
  <!-- GrowUp (design 2. kolo, P1): detail projektu. Data: growupcrm.projects.get_project; úkoly = CRM Task s polem project -->
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs class="gl-crumbs" :items="[{ label: __('Projekty'), route: { name: 'Projects' } }, { label: p?.project_name || '…' }]" />
    </template>
    <template #right-header>
      <Button class="hidden sm:inline-flex" iconLeft="edit-2" :label="__('Upravit')" @click="openEdit" />
      <Dropdown v-if="p" :options="statusOptions">
        <Button :label="statusLabel" iconRight="chevron-down" class="hidden sm:inline-flex">
          <template #prefix><span class="size-2 rounded-full" :style="{ background: STATUS_COLORS[p.status === 'Čeká' ? 'Čeká' : p.display_status] }" /></template>
        </Button>
      </Dropdown>
      <Button variant="solid" iconLeft="plus" @click="openTask('')"><span class="hidden sm:inline">{{ __('Přidat úkol') }}</span></Button>
    </template>
  </LayoutHeader>

  <div v-if="project.error" class="px-4 py-10 text-center text-ink-gray-5">{{ project.error.messages?.[0] || __('Projekt se nepodařilo načíst.') }}</div>
  <div v-else-if="p" class="flex min-h-0 flex-1 gap-3 overflow-hidden px-2 pb-2">
    <div class="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
      <div class="gl-card p-5 md:p-6">
        <div class="flex items-start justify-between gap-6">
          <div class="min-w-0">
            <h1 class="truncate text-[28px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9 md:text-[40px]">{{ p.project_name }}</h1>
            <div class="mt-1 truncate text-[17px] text-ink-gray-6">
              <router-link v-if="p.organization" :to="{ name: 'Organization', params: { organizationId: p.organization } }" class="font-medium text-[var(--accent-700)] hover:underline">{{ p.organization_name }}</router-link>
              <template v-if="p.template"> · {{ __('šablona {0}', [__(p.template)]) }}</template>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <div class="text-[13px] text-ink-gray-5">{{ __('Termín') }}</div>
            <div class="num text-[22px] font-bold md:text-[30px]" :class="p.display_status === 'Zpožděno' ? 'text-[#a82614]' : 'text-ink-gray-9'">{{ p.deadline ? fullDate(p.deadline) : __('Bez termínu') }}</div>
            <div v-if="p.days_left !== null" class="text-[13px] text-ink-gray-5">{{ daysLeft }}</div>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap items-center gap-3">
          <div class="h-2.5 min-w-[140px] flex-1 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><div class="h-full rounded-full bg-[var(--accent-600)] transition-all duration-500" :style="{ width: `${progress}%` }" /></div>
          <span class="num text-[15px] font-bold text-ink-gray-9">{{ progress }} %</span>
          <span class="num text-[13px] text-ink-gray-5">{{ __('{0} z {1} úkolů', [doneCount, p.tasks.length]) }}</span>
        </div>
        <!-- čekání na klienta -->
        <div v-if="p.status === 'Čeká' || p.waiting" class="mt-4 flex flex-wrap items-center gap-3 rounded-[18px] bg-[rgba(224,161,0,.14)] px-4 py-3 text-[#7a4400]">
          <GlIcon name="clock" :size="22" />
          <div class="min-w-0 flex-1">
            <div class="truncate text-[15px] font-bold">{{ __('Čeká na klienta') }}: {{ p.waiting?.title || p.waiting_note }}</div>
            <div class="truncate text-[13px]">
              <template v-if="p.waiting">{{ __('od {0}', [shortDate(p.waiting.since)]) }} · {{ daysWord(p.waiting.days) }}<template v-if="p.waiting.blocks"> · {{ __('blokuje {0}', [p.waiting.blocks]) }}</template></template>
              <template v-else-if="p.waiting_since">{{ __('od {0}', [shortDate(p.waiting_since)]) }}</template>
            </div>
          </div>
          <button class="gl-quick" @click="remind"><GlIcon name="mail" :size="15" />{{ __('Připomenout') }}</button>
          <button class="inline-flex h-9 items-center gap-2 rounded-full bg-[var(--accent-600)] px-4 text-[13px] font-semibold text-white" @click="resolveWaiting"><GlIcon name="check" :size="15" />{{ __('Podklady dorazily') }}</button>
        </div>
      </div>

      <div class="gl-card p-5 md:p-6">
        <!-- design 3. kolo (18): Úkoly · + Přidat úkol, přepínač, fáze se sbalují a mají vlastní „+ Přidat úkol“ -->
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="text-[28px] font-bold tracking-[-0.02em] text-ink-gray-9">{{ __('Úkoly') }}</h2>
          <button class="flex items-center gap-1.5 text-[15px] font-semibold text-[var(--accent-600)] hover:underline" @click="openTask('')"><GlIcon name="plus" :size="16" />{{ __('Přidat úkol') }}</button>
        </div>
        <div class="gl-seg mb-3 inline-flex">
          <button v-for="v in VIEWS" :key="v.key" class="gl-seg-btn" :class="view === v.key && 'gl-seg-on !bg-[var(--accent-600)] !text-white'" @click="view = v.key">{{ v.label }}</button>
        </div>
        <div v-for="g in groups" :key="g.phase" class="border-t border-[var(--line)] py-2">
          <div v-if="g.phase || view === 'phase'" class="flex items-center gap-3 py-1.5">
            <button class="flex min-w-0 items-center gap-2" :aria-expanded="!collapsed[g.phase]" @click="collapsed[g.phase] = !collapsed[g.phase]">
              <GlIcon :name="collapsed[g.phase] ? 'right' : 'down'" :size="16" class="text-ink-gray-5" />
              <b class="truncate text-[17px] text-ink-gray-9">{{ g.phase || __('Bez fáze') }}</b>
            </button>
            <span class="num text-[14px] text-ink-gray-5">{{ g.done }} / {{ g.tasks.length }}</span>
            <span class="h-1.5 w-40 overflow-hidden rounded-full bg-[rgba(110,120,200,.16)]"><span class="block h-full rounded-full bg-[var(--accent-600)]" :style="{ width: `${g.tasks.length ? (g.done * 100) / g.tasks.length : 0}%` }" /></span>
            <button v-if="view === 'phase'" class="ml-auto flex shrink-0 items-center gap-1.5 text-[14px] font-semibold text-[var(--accent-600)] hover:underline" @click="openTask(g.phase)"><GlIcon name="plus" :size="15" />{{ __('Přidat úkol') }}</button>
          </div>
          <template v-if="!collapsed[g.phase]">
          <div v-for="t in g.tasks" :key="t.name" class="flex cursor-pointer items-center gap-3 rounded-2xl py-2 pl-7 pr-1 hover:bg-white/50" @click="(e) => !e.target.closest('button,a') && openTask(null, t.name)">
            <button
              class="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.75px] transition"
              :class="t.status === 'Done' ? 'border-[var(--accent-600)] bg-[var(--accent-600)] text-white' : 'border-[rgba(110,120,200,.45)] hover:border-[var(--accent-600)]'"
              :aria-label="t.status === 'Done' ? __('Vrátit mezi otevřené') : __('Označit jako hotové')"
              @click="toggleTask(t)"
            ><GlIcon v-if="t.status === 'Done'" name="check" :size="14" /></button>
            <span class="min-w-0 flex-1 truncate text-[15px]" :class="t.status === 'Done' ? 'text-ink-gray-5 line-through' : 'font-medium text-ink-gray-9'">{{ t.title }}</span>
            <span v-if="t.waiting_on_client && t.status !== 'Done'" class="shrink-0 rounded-full bg-[rgba(224,161,0,.22)] px-2.5 py-0.5 text-[11px] font-bold text-[#7a4400]">{{ __('čeká na klienta') }}</span>
            <span v-if="t.due_date" class="num shrink-0 text-[13px]" :class="isOverdue(t) ? 'font-semibold text-[#a82614]' : 'text-ink-gray-5'">{{ shortDate(t.due_date) }}</span>
            <GlUserAvatar v-if="t.assigned_to" :user="t.assigned_to" class="size-7 bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]" />
            <span v-else class="size-7 shrink-0" />
          </div>
          </template>
        </div>
        <p v-if="!groups.length" class="py-6 text-center text-[14px] text-ink-gray-5">{{ view === 'mine' ? __('Žádné vaše úkoly.') : __('Projekt zatím nemá úkoly.') }}</p>
      </div>
    </div>

    <!-- design 3. kolo (18): Detaily a Milníky ve sloupci, Tým vedle (na užší obrazovce pod sebou) -->
    <div class="hidden shrink-0 gap-3 overflow-y-auto lg:flex lg:flex-col xl:flex-row xl:items-start">
    <div class="flex w-[330px] flex-col gap-3">
      <div class="gl-card p-6">
        <h2 class="mb-2 text-[24px] font-bold tracking-tight text-ink-gray-9">{{ __('Detaily') }}</h2>
        <dl class="flex flex-col">
          <div v-for="r in details" :key="r.label" class="flex items-center justify-between gap-4 border-b border-[var(--line)] py-3 last:border-b-0">
            <dt class="shrink-0 text-[15px] text-ink-gray-5">{{ r.label }}</dt>
            <dd class="flex min-w-0 items-center gap-2 truncate text-right text-[15px] font-medium text-ink-gray-9">
              <GlUserAvatar v-if="r.user" :user="r.user" class="size-7 bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]" />
              <router-link v-if="r.value && r.to" :to="r.to" class="truncate font-semibold text-[var(--accent-600)] hover:underline">{{ r.value }}</router-link>
              <template v-else-if="r.value">{{ r.value }}</template>
              <span v-else class="gl-empty">{{ __('Bez hodnoty') }}</span>
            </dd>
          </div>
        </dl>
        <div v-if="p.budget_hours" class="mt-2">
          <div class="text-[15px] text-ink-gray-5">{{ __('Rozpočet hodin') }}</div>
          <div class="num mt-1 text-[20px] font-bold text-ink-gray-9">{{ new Intl.NumberFormat('cs-CZ').format(p.budget_hours) }} h</div>
        </div>
      </div>
      <div v-if="p.milestones?.length" class="gl-card p-6">
        <h2 class="mb-3 text-[24px] font-bold tracking-tight text-ink-gray-9">{{ __('Milníky') }}</h2>
        <div class="relative">
          <div v-for="(m, i) in p.milestones" :key="m.title" class="relative flex gap-4 pb-5 last:pb-0">
            <span v-if="i < p.milestones.length - 1" class="absolute left-[9px] top-6 h-[calc(100%-18px)] w-px bg-[rgba(110,120,200,.3)]" aria-hidden="true" />
            <span class="relative z-[1] mt-1 size-[19px] shrink-0 rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgba(110,120,200,.25)]" :style="{ background: m.done ? '#22b35e' : m.client ? '#e0a100' : '#a3a8cc' }" />
            <span class="min-w-0 flex-1 border-b border-[var(--line)] pb-4" :class="i === p.milestones.length - 1 && 'border-b-0 pb-0'">
              <span class="flex items-baseline justify-between gap-3">
                <span class="truncate text-[16px] font-semibold text-ink-gray-9" :class="m.done && 'line-through opacity-60'">{{ m.title }}</span>
                <span v-if="m.date && m.client && !m.done" class="num shrink-0 text-[15px]" :class="m.date < today ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-6'">{{ shortDate(m.date) }}</span>
              </span>
              <span v-if="m.client && !m.done" class="block text-[14px] font-medium text-[#d48a00]">{{ __('čeká se') }}</span>
              <span v-else-if="m.date" class="num block text-[14px]" :class="!m.done && m.date < today ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-6'">{{ shortDate(m.date) }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
    <div class="flex w-[330px] flex-col gap-3 xl:w-[300px]">
      <div class="gl-card p-6">
        <div class="mb-3 flex items-baseline justify-between"><h2 class="text-[24px] font-bold tracking-tight text-ink-gray-9">{{ __('Tým') }}</h2><button class="flex items-center gap-1 text-[14px] font-semibold text-[var(--accent-600)] hover:underline" @click="openEdit"><GlIcon name="edit" :size="14" />{{ __('Upravit') }}</button></div>
        <div v-for="m in p.team_load" :key="m.user" class="flex items-center gap-3 border-b border-[var(--line)] py-3 last:border-b-0">
          <GlUserAvatar :user="m.user" class="size-12 bg-[#dde6ff] text-[14px] font-bold text-[#2440a6]" />
          <span class="min-w-0 flex-1"><span class="block truncate text-[16px] font-semibold text-ink-gray-9">{{ userName(m.user) }}</span><span class="block text-[13px] text-ink-gray-5">{{ m.owner ? __('vlastník') : __('člen týmu') }}</span></span>
          <span class="num shrink-0 rounded-full bg-[rgba(110,120,200,.1)] px-2.5 py-0.5 text-[12.5px] font-medium text-ink-gray-6">{{ tasksWord(m.tasks) }}</span>
        </div>
      </div>
    </div>
    </div>
  </div>

  <GlTaskModal v-if="showTask" v-model="showTask" :task="taskName" :defaults="taskDefaults" @saved="project.reload()" />
  <Dialog v-model:open="showWaiting" :title="__('Projekt čeká')">
    <template #default>
      <label><span class="gl-label">{{ __('Na co čekáme?') }}</span><input v-model="waitingNote" class="gl-field w-full" :placeholder="__('Např. podklady od klienta')" /></label>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showWaiting = false" />
        <Button variant="solid" :label="__('Uložit')" @click="setStatus('Čeká', waitingNote)" />
      </div>
    </template>
  </Dialog>

  <Dialog v-model:open="showEdit" :title="__('Upravit projekt')">
    <template #default>
      <div class="flex flex-col gap-3.5">
        <label><span class="gl-label">{{ __('Název projektu') }}</span><input v-model="edit.project_name" class="gl-field w-full" /></label>
        <div class="grid grid-cols-2 gap-3">
          <div><span class="gl-label">{{ __('Začátek') }}</span><GlDatePicker v-model="edit.start_date" /></div>
          <div><span class="gl-label">{{ __('Termín') }}</span><GlDatePicker v-model="edit.deadline" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label><span class="gl-label">{{ __('Rozpočet hodin') }}</span><input v-model="edit.budget_hours" class="gl-field w-full tabular-nums" inputmode="decimal" /></label>
          <label><span class="gl-label">{{ __('Vlastník') }}</span>
            <select v-model="edit.project_owner" class="gl-field w-full"><option v-for="u in memberOptions" :key="u" :value="u">{{ userName(u) }}</option></select></label>
        </div>
        <div>
          <span class="gl-label">{{ __('Tým') }}</span>
          <div class="flex flex-wrap gap-2">
            <button v-for="u in allUsers" :key="u.name" type="button" class="gl-chip h-9 rounded-full px-3.5 text-[14px]" :class="edit.team.includes(u.name) && 'gl-chip-on'" @click="toggleMember(u.name)">{{ u.full_name }}</button>
          </div>
        </div>
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showEdit = false" />
        <Button variant="solid" :label="__('Uložit')" @click="saveEdit" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlTaskModal from '@/components/Modals/GlTaskModal.vue'
import GlDatePicker from '@/components/GlDatePicker.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { sessionStore } from '@/stores/session'
import GlUserAvatar from '@/components/GlUserAvatar.vue'
import { usersStore } from '@/stores/users'
import { formatDateCz, shortDateCz } from '@/utils/glDate'
import { Breadcrumbs, Button, Dialog, Dropdown, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, h, reactive, ref } from 'vue'

const props = defineProps({ projectId: { type: String, required: true } })
const { getUser, users } = usersStore()
const sessionUser = sessionStore().user

const project = createResource({ url: 'growupcrm.projects.get_project', params: { name: props.projectId }, auto: true })
const p = computed(() => project.data)
usePageMeta(() => ({ title: p.value?.project_name || __('Projekt') }))

const STATUS_COLORS = { 'Probíhá': '#3b82f6', 'Průběžně': '#8b5cf6', 'Zpožděno': '#e5484d', 'Čeká': '#e0a100', 'Dokončeno': '#22b35e', 'Zrušeno': '#9ca3af' }
const STATUSES = ['Čeká', 'Probíhá', 'Průběžně', 'Dokončeno', 'Zrušeno']
const today = new Date().toISOString().slice(0, 10)

const statusLabel = computed(() => (p.value.status === 'Čeká' ? __('Čeká na klienta') : __(p.value.display_status)))
const doneCount = computed(() => (p.value?.tasks || []).filter((t) => t.status === 'Done').length)
const progress = computed(() => {
  const all = (p.value?.tasks || []).filter((t) => t.status !== 'Canceled').length
  return all ? Math.round((doneCount.value * 100) / all) : 0
})

// přepínač: Podle fází · Podle termínu · Moje
const VIEWS = [
  { key: 'phase', label: __('Podle fází') },
  { key: 'date', label: __('Podle termínu') },
  { key: 'mine', label: __('Moje') },
]
const view = ref('phase')
const groups = computed(() => {
  let tasks = (p.value?.tasks || []).filter((t) => t.status !== 'Canceled')
  if (view.value === 'mine') tasks = tasks.filter((t) => t.assigned_to === sessionUser)
  if (view.value !== 'phase') {
    if (view.value === 'date') tasks = [...tasks].sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')))
    return tasks.length ? [{ phase: '', tasks, done: tasks.filter((t) => t.status === 'Done').length }] : []
  }
  const out = []
  for (const t of tasks) {
    const phase = t.project_phase || ''
    let g = out.find((x) => x.phase === phase)
    if (!g) out.push((g = { phase, tasks: [], done: 0 }))
    g.tasks.push(t)
    if (t.status === 'Done') g.done++
  }
  return out
})

const plural = (n, one, few, many) => `${n} ${n === 1 ? one : n >= 2 && n <= 4 ? few : many}`
const daysWord = (n) => plural(n, 'den', 'dny', 'dní')
const tasksWord = (n) => plural(n, 'úkol', 'úkoly', 'úkolů')
const daysLeft = computed(() => {
  const n = p.value.days_left
  return n < 0 ? __('po termínu o {0}', [daysWord(-n)]) : n === 0 ? __('dnes') : __('za {0}', [daysWord(n)])
})

const statusOptions = computed(() =>
  STATUSES.map((s) => ({
    label: s === 'Čeká' ? __('Čeká na klienta') : __(s),
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
async function resolveWaiting() {
  await call('growupcrm.projects.resolve_waiting', { project: props.projectId })
  toast.success(__('Podklady dorazily, projekt pokračuje'))
  project.reload()
}
async function remind() {
  try {
    await call('growupcrm.projects.remind_client', { project: props.projectId })
    toast.success(__('Vlastníkovi projektu jsme založili úkol „Připomenout klientovi“'))
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

// úkol projektu v okně (design 3. kolo): nový ve fázi, nebo úprava kliknutím na řádek
const collapsed = reactive({})
const showTask = ref(false)
const taskName = ref('')
const taskDefaults = ref({})
function openTask(phase, name = '') {
  taskName.value = name || ''
  taskDefaults.value = name
    ? {}
    : { project: props.projectId, project_phase: phase || '', ref: { kind: 'project', label: `${__('Projekt')} · ${p.value.project_name}${phase ? ` · ${phase}` : ''}` }, reference_docname: '' }
  showTask.value = true
}

const details = computed(() => [
  { label: __('Klient'), value: p.value.organization_name, to: p.value.organization && { name: 'Organization', params: { organizationId: p.value.organization } } },
  {
    label: __('Zakázka'),
    value: p.value.lead ? `${p.value.lead_title}${p.value.lead_value ? ` · ${new Intl.NumberFormat('cs-CZ').format(p.value.lead_value)} Kč` : ''}` : '',
    to: p.value.lead && { name: 'Lead', params: { leadId: p.value.lead } },
  },
  { label: __('Začátek'), value: p.value.start_date ? fullDate(p.value.start_date) : '' },
  { label: __('Vlastník'), value: p.value.project_owner ? userName(p.value.project_owner) : '', user: p.value.project_owner },
])

// úprava projektu
const showEdit = ref(false)
const edit = reactive({ project_name: '', start_date: '', deadline: '', budget_hours: '', project_owner: '', team: [] })
const allUsers = computed(() => (users.data?.crmUsers || []).filter((u) => u.name !== 'Administrator'))
const memberOptions = computed(() => edit.team)
function openEdit() {
  const d = p.value
  Object.assign(edit, { project_name: d.project_name, start_date: d.start_date || '', deadline: d.deadline || '', budget_hours: d.budget_hours || '', project_owner: d.project_owner, team: d.team.map((m) => m.user) })
  showEdit.value = true
}
function toggleMember(u) {
  const i = edit.team.indexOf(u)
  if (i >= 0) edit.team.length > 1 && edit.team.splice(i, 1)
  else edit.team.push(u)
  if (!edit.team.includes(edit.project_owner)) edit.project_owner = edit.team[0]
}
async function saveEdit() {
  try {
    await call('growupcrm.projects.update_project', { name: props.projectId, ...edit, team: JSON.stringify(edit.team) })
    showEdit.value = false
    project.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

const userName = (u) => getUser(u)?.full_name || u
const toDate = (s) => new Date(String(s).length === 10 ? `${s}T00:00` : String(s).replace(' ', 'T'))
const fullDate = formatDateCz
const shortDate = shortDateCz
const isOverdue = (t) => t.status !== 'Done' && t.due_date && toDate(t.due_date) < new Date()
</script>
