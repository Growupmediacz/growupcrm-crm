<template>
  <!-- GrowUp: náhled události v kalendáři (design „Kalendář → klik na událost“). -->
  <Teleport to="body">
    <div v-if="item" class="fixed inset-0 z-40" @mousedown.self="close">
      <div
        ref="card"
        class="gl-sheet absolute w-[380px] max-w-[calc(100vw-24px)] rounded-[22px] p-5"
        :style="pos"
        role="dialog"
        :aria-label="item.title"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="rounded-full bg-[rgba(59,110,246,.14)] px-2.5 py-0.5 text-[12px] font-bold text-[#1f48b8]">{{ __('Schůzka') }}</span>
          <button class="flex size-8 items-center justify-center rounded-full bg-[rgba(110,120,200,.12)]" :aria-label="__('Zavřít')" @click="close">
            <GlIcon name="x" :size="14" />
          </button>
        </div>
        <h3 class="mt-2 text-[20px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ item.title }}</h3>
        <div class="mt-1 text-[14px] text-ink-gray-7">{{ when }}</div>

        <div class="mt-3 flex flex-col gap-2 text-[14px]">
          <router-link
            v-if="item.leadName"
            :to="{ name: 'Lead', params: { leadId: item.leadName } }"
            class="flex items-center gap-2 font-semibold text-[#4f46e5] hover:underline"
            @click="close"
          >
            <GlIcon name="brief" :size="16" />{{ item.leadTitle || item.leadName }}
          </router-link>
          <router-link
            v-else-if="item.organization"
            :to="{ name: 'Organization', params: { organizationId: item.organization } }"
            class="flex items-center gap-2 font-semibold text-[#4f46e5] hover:underline"
            @click="close"
          >
            <GlIcon name="building" :size="16" />{{ item.organization }}
          </router-link>
          <div v-if="item.assignedTo" class="flex items-center gap-2 text-ink-gray-7">
            <span class="flex size-7 items-center justify-center rounded-full bg-[#dde6ff] text-[11px] font-bold text-[#2440a6]">
              {{ initials(userName) }}
            </span>
            {{ userName }}
          </div>
          <div v-if="plain" class="line-clamp-3 text-[13px] text-ink-gray-5">{{ plain }}</div>
        </div>

        <div class="mt-4 flex items-center gap-2">
          <Button v-if="item.leadName" variant="solid" iconLeft="file-text" :label="__('Zapsat zápis')" @click="showNote = true" />
          <Button v-if="item.canEdit" iconLeft="clock" :label="__('Přesunout')" @click="emit('edit', item)" />
          <Button v-else iconLeft="eye" :label="__('Detail')" @click="emit('edit', item)" />
          <div class="flex-1" />
          <button
            v-if="item.canEdit"
            class="flex size-9 items-center justify-center rounded-full bg-[rgba(200,50,31,.09)] text-[#a82614] hover:bg-[rgba(200,50,31,.16)]"
            :aria-label="__('Smazat událost')"
            @click="remove"
          >
            <GlIcon name="trash" :size="16" />
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <Dialog v-model:open="showNote" :title="__('Zápis ze schůzky')">
    <template #default>
      <FormControl v-model="noteText" type="textarea" :rows="5" :placeholder="__('Co jste probrali, na čem jste se domluvili…')" />
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="showNote = false" />
        <Button variant="solid" :label="__('Uložit zápis')" :loading="saving" :disabled="!noteText.trim()" @click="saveNote" />
      </div>
    </template>
  </Dialog>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { usersStore } from '@/stores/users'
import { htmlToText } from '@/utils'
import { Button, Dialog, FormControl, call, toast } from 'frappe-ui'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  item: { type: Object, default: null },
  // kde uživatel klikl: { x, y }
  anchor: { type: Object, default: () => ({ x: 0, y: 0 }) },
})
const emit = defineEmits(['close', 'edit', 'changed'])
const { getUser } = usersStore()

const showNote = ref(false)
const noteText = ref('')
const saving = ref(false)

const W = 380
const H = 300
const pos = computed(() => {
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = props.anchor.x + 16
  if (left + W > vw - 12) left = Math.max(12, props.anchor.x - W - 16)
  let top = Math.min(Math.max(12, props.anchor.y - 40), vh - H - 12)
  return { left: `${left}px`, top: `${top}px` }
})

const userName = computed(() => (props.item?.assignedTo ? getUser(props.item.assignedTo).full_name : ''))
const plain = computed(() => htmlToText(props.item?.description || '').trim())
const when = computed(() => {
  const i = props.item
  if (!i) return ''
  const day = i.start.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })
  if (i.allDay) return `${day} · ${__('celý den')}`
  const t = (d) => d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  return `${day} · ${t(i.start)}–${t(i.end)}`
})

const initials = (s) =>
  (s || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

function close() {
  emit('close')
}
function onKey(e) {
  if (e.key === 'Escape' && props.item && !showNote.value) close()
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

async function remove() {
  if (!confirm(__('Opravdu chcete tuto událost smazat?'))) return
  try {
    await call('growupcrm.calendar.delete_event', { name: props.item.name })
    toast.success(__('Událost byla smazána'))
    emit('changed')
    close()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  }
}

async function saveNote() {
  saving.value = true
  try {
    await call('frappe.client.insert', {
      doc: {
        doctype: 'FCRM Note',
        title: props.item.title,
        content: noteText.value.trim().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>'),
        reference_doctype: 'CRM Lead',
        reference_docname: props.item.leadName,
      },
    })
    toast.success(__('Zápis byl uložen k zakázce'))
    showNote.value = false
    noteText.value = ''
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    saving.value = false
  }
}
</script>
