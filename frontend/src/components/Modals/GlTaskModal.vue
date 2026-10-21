<template>
  <!-- GrowUp (design 3. kolo, Úkoly 13 a kalendář 06): nový úkol i úprava – komu, kdy (bez času = celý den),
       priorita, stav, vazba na zakázku nebo firmu. Data: growupcrm.worklists.get_task / save_task / delete_task.
       Úkol s termínem se sám ukáže v kalendáři (řádek Celý den, s časem jako blok). -->
  <Dialog v-model:open="show" :options="{ size: 'xl' }">
    <template #body-title>
      <div class="flex items-center gap-3.5">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-[#e0a100] text-white shadow-[0_8px_18px_-8px_rgba(224,161,0,.7)]"><GlIcon name="check" :size="22" /></span>
        <div class="flex min-w-0 flex-col">
          <h3 class="text-[24px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ task ? __('Upravit úkol') : __('Nový úkol') }}</h3>
          <span v-if="form.ref?.label" class="truncate text-[13px] text-ink-gray-5">{{ form.ref.label }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <GlSkeleton v-if="task && !loaded" :rows="4" />
      <div v-else class="flex flex-col gap-4">
        <FormControl v-model="form.title" :label="__('Název')" :placeholder="__('Např. Zavolat kvůli nabídce')" :disabled="readonly" />
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Komu') }}</div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="u in team"
                :key="u.name"
                type="button"
                class="gl-chip flex h-9 items-center gap-2 rounded-full pl-1 pr-3 text-[13.5px] font-medium"
                :class="form.assigned_to === u.name && '!bg-[var(--accent-600)] !text-white'"
                :disabled="readonly"
                @click="form.assigned_to = u.name"
              >
                <img v-if="u.user_image" :src="u.user_image" class="size-7 rounded-full object-cover" />
                <span v-else class="flex size-7 items-center justify-center rounded-full bg-[#dde6ff] text-[10px] font-bold text-[#2440a6]">{{ initials(u.full_name) }}</span>
                {{ u.name === me ? __('Já') : u.full_name }}
              </button>
            </div>
          </div>
          <fieldset class="grid grid-cols-[minmax(0,1fr)_120px] gap-2" :disabled="readonly">
            <div class="min-w-0">
              <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Termín') }}</div>
              <GlDatePicker v-model="form.date" class="w-full" :label="__('Termín')" :placeholder="__('Bez termínu')" />
            </div>
            <div v-if="form.date" class="min-w-0">
              <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Čas') }}</div>
              <GlTimePicker v-model="form.time" :label="__('Čas')" :placeholder="__('Celý den')" />
            </div>
            <div class="col-span-2 -mt-1 flex items-center gap-2 text-[12px] text-ink-gray-5">
              {{ !form.date ? __('Bez termínu – v kalendáři se neukáže.') : form.time ? __('V kalendáři jako blok v daný čas.') : __('Bez času – v kalendáři v řádku „Celý den“.') }}
              <button v-if="form.date && form.time" type="button" class="font-semibold text-[var(--accent-600)]" @click="form.time = ''">{{ __('Bez času') }}</button>
            </div>
          </fieldset>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Priorita') }}</div>
            <div class="gl-seg flex w-full">
              <button v-for="p in PRIORITIES" :key="p.value" type="button" class="gl-seg-btn flex-1 justify-center" :class="form.priority === p.value && 'gl-seg-on'" :disabled="readonly" @click="form.priority = p.value">{{ p.label }}</button>
            </div>
          </div>
          <div>
            <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Stav') }}</div>
            <div class="gl-seg flex w-full">
              <button v-for="s in STATUSES" :key="s.value" type="button" class="gl-seg-btn flex-1 justify-center whitespace-nowrap px-2" :class="form.status === s.value && 'gl-seg-on'" :disabled="readonly" @click="form.status = s.value">{{ s.label }}</button>
            </div>
          </div>
        </div>
        <div>
          <div class="mb-1.5 text-xs text-ink-gray-5">{{ __('Navázáno na') }}</div>
          <div v-if="form.ref && form.reference_docname" class="flex items-center gap-2">
            <span class="rounded-full bg-[color-mix(in_srgb,var(--accent-600)_10%,transparent)] px-3 py-1.5 text-[13.5px] font-medium text-[var(--accent-700)]">{{ form.ref.label }}</span>
            <button v-if="!readonly && form.ref.kind !== 'project'" type="button" class="text-[13px] text-ink-gray-5 hover:text-ink-gray-8" @click="clearRef">{{ __('Zrušit vazbu') }}</button>
          </div>
          <div v-else class="grid grid-cols-[150px_1fr] gap-2">
            <div class="gl-seg flex">
              <button v-for="r in REFS" :key="r.dt" type="button" class="gl-seg-btn flex-1 justify-center" :class="refType === r.dt && 'gl-seg-on'" :disabled="readonly" @click="refType = r.dt">{{ r.label }}</button>
            </div>
            <Link v-model="refValue" :doctype="refType" :placeholder="refType === 'CRM Lead' ? __('Vyberte zakázku (nepovinné)') : __('Vyberte firmu (nepovinné)')" :disabled="readonly" />
          </div>
        </div>
        <FormControl v-model="form.description" type="textarea" :rows="3" :label="__('Poznámka')" :placeholder="__('Podrobnosti, na co nezapomenout…')" :disabled="readonly" />
        <div v-if="readonly" class="rounded-xl bg-[rgba(110,120,200,.08)] px-3 py-2 text-[13px] text-ink-gray-6">{{ __('Úkol patří kolegovi, můžete ho jen zobrazit.') }}</div>
        <ErrorMessage :message="error" />
      </div>
    </template>
    <template #actions>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <Button v-if="task && canDelete" variant="ghost" theme="red" iconLeft="trash-2" :label="__('Smazat')" @click="remove" />
        <span v-else />
        <div class="flex gap-2">
          <Button :label="__('Zrušit')" @click="show = false" />
          <Button v-if="!readonly" variant="solid" :label="task ? __('Uložit') : __('Vytvořit úkol')" :loading="saving" @click="save" />
        </div>
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import Link from '@/components/Controls/Link.vue'
import GlDatePicker from '@/components/GlDatePicker.vue'
import GlTimePicker from '@/components/GlTimePicker.vue'
import { sessionStore } from '@/stores/session'
import { Button, Dialog, ErrorMessage, FormControl, call, createResource, toast } from 'frappe-ui'
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  task: { type: String, default: '' },
  // předvyplnění nového úkolu (např. datum z kalendáře, zakázka)
  defaults: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['saved'])
const show = defineModel({ type: Boolean })
const me = sessionStore().user

const PRIORITIES = [
  { value: 'Low', label: __('Nízká') },
  { value: 'Medium', label: __('Střední') },
  { value: 'High', label: __('Vysoká') },
]
const STATUSES = [
  { value: 'Todo', label: __('K udělání') },
  { value: 'In Progress', label: __('Probíhá') },
  { value: 'Done', label: __('Hotovo') },
]
const REFS = [
  { dt: 'CRM Lead', label: __('Zakázka') },
  { dt: 'CRM Organization', label: __('Firma') },
]

const form = reactive({ title: '', description: '', status: 'Todo', priority: 'Medium', assigned_to: me, date: '', time: '', reference_doctype: '', reference_docname: '', ref: null, ...props.defaults })
const refType = ref(props.defaults.reference_doctype === 'CRM Organization' ? 'CRM Organization' : 'CRM Lead')
const refValue = ref('')
const loaded = ref(!props.task)
const canEdit = ref(true)
const canDelete = ref(false)
const readonly = computed(() => !canEdit.value)
const error = ref('')
const saving = ref(false)

const users = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const team = computed(() => {
  const list = users.data || []
  // já první, pak ostatní podle jména
  return [...list.filter((u) => u.name === me), ...list.filter((u) => u.name !== me)]
})
const initials = (s) => (s || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

if (props.task) {
  createResource({
    url: 'growupcrm.worklists.get_task',
    params: { name: props.task },
    auto: true,
    onSuccess: (d) => {
      Object.assign(form, d)
      canEdit.value = d.can_edit
      canDelete.value = d.can_delete
      loaded.value = true
    },
    onError: (e) => (error.value = e.messages?.[0] || __('Úkol se nepodařilo načíst')),
  })
}

function clearRef() {
  form.ref = null
  form.reference_doctype = ''
  form.reference_docname = ''
}

async function save() {
  error.value = ''
  if (!(form.title || '').trim()) return (error.value = __('Zadejte název úkolu.'))
  const data = {
    title: form.title, description: form.description, status: form.status, priority: form.priority,
    assigned_to: form.assigned_to, date: form.date || '', time: form.date ? form.time || '' : '',
  }
  if (refValue.value) Object.assign(data, { reference_doctype: refType.value, reference_docname: refValue.value })
  else if (!form.reference_docname) Object.assign(data, { reference_doctype: '', reference_docname: '' })
  saving.value = true
  try {
    await call('growupcrm.worklists.save_task', { data: JSON.stringify(data), name: props.task || undefined })
    toast.success(props.task ? __('Úkol uložen') : __('Úkol vytvořen'))
    emit('saved')
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || __('Nepodařilo se uložit')
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!window.confirm(__('Smazat úkol {0}?', [form.title]))) return
  try {
    await call('growupcrm.worklists.delete_task', { name: props.task })
    toast.success(__('Úkol smazán'))
    emit('saved')
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || __('Úkol se nepodařilo smazat')
  }
}
</script>
