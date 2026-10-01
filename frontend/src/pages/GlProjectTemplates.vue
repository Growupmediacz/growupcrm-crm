<template>
  <!-- GrowUp (design 2. kolo, P2): šablony projektů – seznam vlevo, fáze a úkoly s termínem od začátku a rolí vpravo -->
  <LayoutHeader>
    <template #left-header>
      <Breadcrumbs :items="[{ label: __('Projekty'), route: { name: 'Projects' } }, { label: __('Šablony projektů') }]" />
    </template>
    <template #right-header>
      <Button iconLeft="plus" :label="__('Nová šablona')" @click="newTemplate" />
      <Button variant="solid" :loading="saving" :disabled="!form" :label="__('Uložit změny')" @click="save" />
    </template>
  </LayoutHeader>

  <div class="grid min-h-0 flex-1 gap-4 overflow-y-auto px-3 pb-6 md:px-2 lg:grid-cols-[300px_1fr]">
    <div class="gl-card flex h-fit flex-col gap-1 p-3">
      <button v-for="t in list.data || []" :key="t.name" class="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition" :class="current === t.name ? 'bg-[rgba(79,70,229,.1)]' : 'hover:bg-white/60'" @click="open(t.name)">
        <span class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="TONES[t.icon] || 'bg-[rgba(110,120,200,.12)] text-ink-gray-7'"><GlIcon :name="ICONS[t.icon] || 'edit'" :size="18" /></span>
        <span class="min-w-0"><span class="block truncate text-[15px] font-bold text-ink-gray-9">{{ t.name }}</span>
          <span class="block truncate text-[12px] text-ink-gray-5">{{ t.tasks ? `${t.phases} ${phaseWord(t.phases)} · ${t.tasks} úkolů · ${t.duration_days} dní` : __('prázdná šablona') }}</span></span>
      </button>
    </div>

    <div v-if="form" class="gl-card flex flex-col gap-4 p-5 md:p-6">
      <div class="grid gap-3 sm:grid-cols-2">
        <label><span class="gl-label">{{ __('Název šablony') }}</span><input v-model="form.template_name" class="gl-field w-full" /></label>
        <div><span class="gl-label">{{ __('Výchozí délka') }}</span>
          <div class="gl-field flex items-center justify-between"><span class="tabular-nums">{{ duration }} {{ duration === 1 ? 'den' : 'dní' }}</span><span class="text-[13px] text-ink-gray-5">{{ __('spočítáno z úkolů') }}</span></div></div>
      </div>

      <div v-for="(ph, pi) in phases" :key="ph.id" class="rounded-[22px] bg-[rgba(110,120,200,.07)] p-4">
        <div class="mb-2 flex items-center gap-2">
          <input v-model="ph.name" class="gl-field !w-[240px] !font-bold" :aria-label="__('Název fáze')" />
          <Dropdown :options="[{ label: __('Smazat fázi'), icon: 'trash-2', theme: 'red', onClick: () => phases.splice(pi, 1) }]" placement="right" class="ml-auto">
            <button class="flex size-9 items-center justify-center rounded-full text-ink-gray-5 hover:bg-white/70" :aria-label="__('Další akce')"><GlIcon name="more" :size="18" /></button>
          </Dropdown>
        </div>
        <div class="hidden grid-cols-[1fr_130px_190px_28px] gap-2 px-1 pb-1 text-[12px] font-semibold text-ink-gray-5 md:grid"><span>{{ __('Úkol') }}</span><span>{{ __('Termín od začátku') }}</span><span>{{ __('Kdo') }}</span><span /></div>
        <div v-for="(t, ti) in ph.tasks" :key="t.id" class="mb-2 grid grid-cols-[1fr_28px] items-center gap-2 md:grid-cols-[1fr_130px_190px_28px]">
          <input v-model="t.title" class="gl-field w-full" :aria-label="__('Úkol')" />
          <button class="flex size-7 items-center justify-center rounded-full text-ink-gray-5 hover:bg-white/70 md:order-last" :aria-label="__('Odebrat úkol')" @click="ph.tasks.splice(ti, 1)"><GlIcon name="x" :size="14" /></button>
          <label class="gl-field flex items-center gap-2 !px-3 text-ink-gray-5">+ <input v-model.number="t.offset_days" class="w-full min-w-0 bg-transparent text-ink-gray-9 outline-none tabular-nums" inputmode="numeric" :aria-label="__('Termín od začátku')" /> {{ __('dní') }}</label>
          <select v-model="t.role" class="gl-field w-full"><option v-for="r in ROLES" :key="r" :value="r">{{ __(r) }}</option></select>
        </div>
        <button class="flex items-center gap-2 px-1 py-1.5 text-[14px] font-medium text-ink-gray-7 hover:text-[#4F46E5]" @click="ph.tasks.push(mkTask())"><GlIcon name="plus" :size="15" />{{ __('Přidat úkol') }}</button>
      </div>
      <button class="gl-quick self-start" @click="phases.push({ id: ++uid, name: '', tasks: [mkTask()] })"><GlIcon name="plus" :size="15" />{{ __('Přidat fázi') }}</button>
      <p class="text-[13px] text-ink-gray-5">{{ __('Termíny úkolů se při založení projektu dopočítají od data začátku. Role „Klient“ označí úkol jako čekající na klienta.') }}</p>
      <div v-if="current" class="flex justify-start"><Button variant="subtle" theme="red" iconLeft="trash-2" :label="__('Smazat šablonu')" @click="remove" /></div>
      <ErrorMessage :message="error" />
    </div>
  </div>
</template>

<script setup>
import LayoutHeader from '@/components/LayoutHeader.vue'
import GlIcon from '@/components/GlIcon.vue'
import { Breadcrumbs, Button, Dropdown, ErrorMessage, call, createResource, toast } from 'frappe-ui'
import { computed, ref } from 'vue'

const ICONS = { globe: 'globe', send: 'send', play: 'play', edit: 'edit' }
const TONES = { globe: 'bg-[rgba(79,70,229,.12)] text-[#4338ca]', send: 'bg-[rgba(20,160,190,.14)] text-[#0b7488]', play: 'bg-[rgba(249,115,22,.14)] text-[#c2410c]' }
const ROLES = ['Vlastník projektu', 'Člen týmu', 'Klient']
const phaseWord = (n) => (n === 1 ? 'fáze' : n >= 2 && n <= 4 ? 'fáze' : 'fází')

const list = createResource({ url: 'growupcrm.projects.get_templates', auto: true })
const current = ref('')
const form = ref(null)
const phases = ref([])
const saving = ref(false)
const error = ref('')
let uid = 0
const mkTask = (o = {}) => ({ id: ++uid, title: '', offset_days: 0, role: 'Člen týmu', ...o })

const duration = computed(() => Math.max(0, ...phases.value.flatMap((p) => p.tasks.map((t) => Number(t.offset_days) || 0))))

async function open(name) {
  const t = await call('growupcrm.projects.get_template', { name })
  current.value = name
  form.value = { template_name: t.template_name, icon: t.icon }
  const by = []
  for (const r of t.tasks) {
    let ph = by.find((p) => p.name === (r.phase || ''))
    if (!ph) by.push((ph = { id: ++uid, name: r.phase || '', tasks: [] }))
    ph.tasks.push(mkTask({ title: r.title, offset_days: r.offset_days, role: r.role }))
  }
  phases.value = by
}
function newTemplate() {
  current.value = ''
  form.value = { template_name: '', icon: 'edit' }
  phases.value = [{ id: ++uid, name: '', tasks: [mkTask()] }]
}
async function save() {
  error.value = ''
  saving.value = true
  try {
    const tasks = phases.value.flatMap((p) => p.tasks.map((t) => ({ phase: p.name, title: t.title, offset_days: Number(t.offset_days) || 0, role: t.role })))
    const name = await call('growupcrm.projects.save_template', { template_name: form.value.template_name, icon: form.value.icon, tasks: JSON.stringify(tasks), name: current.value || undefined })
    toast.success(__('Šablona je uložená'))
    await list.reload()
    await open(name)
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
async function remove() {
  if (!window.confirm(__('Smazat šablonu?'))) return
  try {
    await call('growupcrm.projects.delete_template', { name: current.value })
    current.value = ''
    form.value = null
    list.reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}
list.promise?.then((d) => d?.length && open(d[0].name))
</script>
