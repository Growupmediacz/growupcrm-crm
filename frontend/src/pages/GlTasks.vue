<template>
  <!-- GrowUp (design 2. kolo, C1): Úkoly – seznam podle termínu. Kanban a uložené pohledy zůstávají v CRM (Tasks.vue). Data: growupcrm.worklists.get_tasks -->
  <CrmTasks v-if="legacy" />
  <template v-else>
    <LayoutHeader>
      <template #left-header>
        <div class="flex min-w-0 items-center gap-3">
          <h1 class="text-lg-medium shrink-0">{{ __('Úkoly') }}</h1>
          <div class="gl-seg hidden sm:inline-flex">
            <button class="gl-seg-btn gl-seg-on">{{ __('Seznam') }}</button>
            <router-link class="gl-seg-btn" :to="{ name: 'Tasks', params: { viewType: 'kanban' } }">{{ __('Kanban') }}</router-link>
          </div>
        </div>
      </template>
      <template #right-header>
        <div v-if="res.data?.is_manager" class="gl-seg">
          <button class="gl-seg-btn" :class="scope === 'mine' && 'gl-seg-on'" @click="scope = 'mine'">{{ __('Moje') }}</button>
          <button class="gl-seg-btn" :class="scope === 'team' && 'gl-seg-on'" @click="scope = 'team'">{{ __('Celý tým') }}</button>
        </div>
        <Button variant="solid" iconLeft="plus" @click="newEl?.focus()"><span class="hidden sm:inline">{{ __('Nový úkol') }}</span></Button>
      </template>
    </LayoutHeader>

    <div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 pb-6 md:px-2">
      <div class="flex flex-wrap items-center justify-between gap-2 px-1">
        <div class="flex flex-wrap gap-2">
          <button v-for="c in CHIPS" :key="c.key" class="gl-chip flex h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-medium" :class="chipClass(c)" @click="bucket = bucket === c.key ? 'all' : c.key">
            {{ c.label }} <span class="num font-semibold">{{ counts[c.count] || 0 }}</span>
          </button>
        </div>
        <label class="flex items-center gap-2 text-[14px]"><span class="text-ink-gray-5">{{ __('Navázáno na') }}:</span>
          <select v-model="kind" class="gl-chip h-10 rounded-full px-3 text-[14px] font-semibold"><option value="">{{ __('Vše') }}</option><option value="lead">{{ __('Zakázka') }}</option><option value="org">{{ __('Firma') }}</option><option value="project">{{ __('Projekt') }}</option><option value="contact">{{ __('Kontakt') }}</option></select>
        </label>
      </div>

      <div class="gl-card p-3 md:p-4">
        <form class="mb-2 flex items-center gap-3 rounded-2xl bg-[rgba(110,120,200,.08)] px-4" @submit.prevent="add">
          <GlIcon name="plus" :size="17" class="text-ink-gray-5" />
          <input ref="newEl" v-model="newTitle" class="h-12 flex-1 bg-transparent text-[15px] outline-none" :placeholder="__('Nový úkol – napište a stiskněte Enter')" />
          <kbd class="rounded-md bg-[rgba(110,120,200,.14)] px-1.5 text-[12px] text-ink-gray-5">↵</kbd>
        </form>

        <p v-if="res.data && !items.length" class="py-12 text-center text-[14px] text-ink-gray-5">{{ __('Žádné úkoly. Napište první do pole nahoře.') }}</p>
        <template v-for="g in grouped" :key="g.bucket">
          <div class="mb-1 mt-3 flex items-baseline gap-2 px-2 text-[13px]"><b :class="g.bucket === 'overdue' ? 'text-[#c8321f]' : 'text-ink-gray-9'">{{ g.label }}</b><span class="num text-ink-gray-5">{{ g.items.length }}</span></div>
          <div v-for="t in g.items" :key="t.name" class="flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-white/50">
            <button class="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.75px] transition" :class="t.status === 'Done' ? 'border-[#4f46e5] bg-[#4f46e5] text-white' : 'border-[rgba(110,120,200,.45)] hover:border-[#4f46e5]'" :aria-label="t.status === 'Done' ? __('Hotovo') : __('Označit jako hotové')" @click="toggle(t)">
              <GlIcon v-if="t.status === 'Done'" name="check" :size="14" />
            </button>
            <span class="min-w-0 flex-1 truncate text-[15px]" :class="t.status === 'Done' ? 'text-ink-gray-5 line-through' : 'font-medium text-ink-gray-9'">{{ t.title }}<GlIcon v-if="t.flag && t.status !== 'Done'" name="flag" :size="13" class="ml-1.5 inline text-[#c8321f]" /></span>
            <router-link v-if="t.ref" :to="refRoute(t.ref)" class="hidden max-w-[260px] shrink-0 truncate rounded-full px-2.5 py-0.5 text-[12px] font-bold sm:block" :class="REF_TONE[t.ref.kind]">{{ t.ref.label }}</router-link>
            <span class="num w-16 shrink-0 text-right text-[13px]" :class="t.bucket === 'overdue' ? 'font-semibold text-[#c8321f]' : 'text-ink-gray-5'">{{ dueLabel(t) }}</span>
            <span v-if="t.assigned_to" class="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2e4bb8]" :title="userName(t.assigned_to)">{{ initials(userName(t.assigned_to)) }}</span>
            <span v-else class="size-7 shrink-0" />
          </div>
        </template>
        <GlListFooter v-if="items.length" class="mt-4 px-2" :modelValue="limit" :options="{ rowCount: items.length, totalCount: res.data?.total }" @update:modelValue="(v) => (limit = v)" @loadMore="limit += 20" />
      </div>
    </div>
  </template>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlListFooter from '@/components/GlListFooter.vue'
import { completeTaskWithUndo } from '@/composables/glTaskDone'
import { usersStore } from '@/stores/users'
import { shortDateCz, formatTimeCz } from '@/utils/glDate'
import { Button, call, createResource, toast } from 'frappe-ui'
import { computed, defineAsyncComponent, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const CrmTasks = defineAsyncComponent(() => import('@/pages/Tasks.vue'))
const route = useRoute()
// Kanban, skupiny a uložené pohledy zůstávají v CRM
const legacy = computed(() => (route.params.viewType && route.params.viewType !== 'list') || !!route.query.view)

const { getUser } = usersStore()
const scope = ref('mine')
const bucket = ref('all')
const kind = ref('')
const limit = ref(20)
const newTitle = ref('')
const newEl = ref(null)

const CHIPS = [
  { key: 'overdue', label: __('Po termínu'), count: 'overdue' },
  { key: 'today', label: __('Dnes'), count: 'today' },
  { key: 'week', label: __('Tento týden'), count: 'week' },
  { key: 'nodate', label: __('Bez termínu'), count: 'nodate' },
]
const chipClass = (c) => (bucket.value === c.key ? (c.key === 'today' ? '!border-[#0e1330] !bg-[#0e1330] !text-white' : 'gl-chip-on') : c.key === 'overdue' && (counts.value.overdue || 0) ? '!bg-[rgba(200,50,31,.1)] !text-[#c8321f]' : '')

const res = createResource({ url: 'growupcrm.worklists.get_tasks', params: params(), auto: true })
function params() {
  return { scope: scope.value, bucket: bucket.value, kind: kind.value || undefined, limit: limit.value }
}
watch([scope, bucket, kind, limit], () => res.fetch(params()))
const items = computed(() => res.data?.items || [])
const counts = computed(() => res.data?.counts || {})

const LABELS = { overdue: __('Po termínu'), today: __('Dnes'), tomorrow: __('Zítra'), week: __('Tento týden'), later: __('Později'), nodate: __('Bez termínu'), done: __('Hotovo dnes') }
const grouped = computed(() => {
  const out = []
  for (const t of items.value) {
    let g = out.find((x) => x.bucket === t.bucket)
    if (!g) out.push((g = { bucket: t.bucket, label: LABELS[t.bucket], items: [] }))
    g.items.push(t)
  }
  return out
})

const REF_TONE = {
  lead: 'bg-[rgba(139,92,246,.14)] text-[#6d3fd6]', project: 'bg-[rgba(59,110,246,.13)] text-[#2e5bd8]',
  org: 'bg-[rgba(110,120,200,.14)] text-[#4a5173]', contact: 'bg-[rgba(110,120,200,.14)] text-[#4a5173]',
}
const refRoute = (r) => ({ lead: { name: 'Lead', params: { leadId: r.to } }, project: { name: 'Project', params: { projectId: r.to } }, org: { name: 'Organization', params: { organizationId: r.to } }, contact: { name: 'Contact', params: { contactId: r.to } } })[r.kind]
const dueLabel = (t) => {
  if (!t.due_date) return ''
  const d = new Date(t.due_date.replace(' ', 'T'))
  if (t.bucket === 'today' || t.bucket === 'done') return formatTimeCz(d)
  return shortDateCz(d)
}
const userName = (u) => getUser(u)?.full_name || u
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

async function add() {
  if (!newTitle.value.trim()) return
  try {
    await call('growupcrm.worklists.add_task', { title: newTitle.value })
    newTitle.value = ''
    res.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
async function toggle(t) {
  try {
    if (t.status === 'Done') await call('frappe.client.set_value', { doctype: 'CRM Task', name: t.name, fieldname: 'status', value: 'Todo' }).then(() => res.reload())
    else {
      t.status = 'Done'
      await completeTaskWithUndo(t.name, t.title, () => res.reload())
    }
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
    res.reload()
  }
}
</script>
