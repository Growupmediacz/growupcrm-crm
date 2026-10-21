<!-- eslint-disable vue/no-v-html -->
<template>
  <!-- GrowUp (design 3. kolo, 22): vysoký panel hned vedle levé lišty, stránka za ním ztlumená;
       Vše / Nepřečtené / Zmínky, skupiny Dnes / Včera / Starší, nepřečtené s tečkou a podbarvením. -->
  <div v-if="visible" class="fixed inset-0 z-[29] bg-[rgba(30,36,90,.12)] backdrop-blur-[2px]" aria-hidden="true" />
  <div
    v-if="visible"
    ref="target"
    class="gl-sheet fixed bottom-[var(--gl-page-m)] left-[calc(var(--gl-page-m)+var(--gl-rail-w)+16px)] top-[var(--gl-page-m)] z-30 flex w-[440px] max-w-[calc(100vw-180px)] flex-col overflow-hidden rounded-[32px]"
    role="dialog"
    :aria-label="__('Oznámení')"
  >
    <div class="flex items-center justify-between gap-3 px-6 pb-3 pt-6">
      <div class="flex items-center gap-2.5">
        <h2 class="text-[24px] font-bold tracking-[-0.02em] text-ink-gray-9">{{ __('Oznámení') }}</h2>
        <span v-if="unread" class="whitespace-nowrap rounded-full bg-[var(--accent-600)] px-2.5 py-0.5 text-[12px] font-semibold text-white">{{ __('{0} nové', [unread]) }}</span>
      </div>
      <div class="flex items-center gap-1">
        <button v-if="unread" class="rounded-full px-2 py-1 text-[13px] font-semibold text-[var(--accent-700)] hover:bg-[var(--accent-soft)] whitespace-nowrap" @click="markAllAsRead">{{ __('Přečíst vše') }}</button>
        <Button :tooltip="__('Close')" icon="x" variant="ghost" @click="() => toggle()" />
      </div>
    </div>
    <div class="px-6 pb-3">
      <div class="gl-seg flex w-full">
        <button v-for="f in FILTERS" :key="f.key" class="gl-seg-btn flex-1 justify-center" :class="filter === f.key && 'gl-seg-on'" @click="filter = f.key">{{ f.label }}</button>
      </div>
    </div>
    <div v-if="grouped.length" class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <template v-for="g in grouped" :key="g.label">
        <div class="px-3 pb-1.5 pt-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink-gray-5">{{ g.label }}</div>
        <RouterLink
          v-for="n in g.items"
          :key="n.comment || n.name"
          :to="getRoute(n)"
          class="mb-1 flex cursor-pointer items-start gap-3 rounded-[18px] px-3 py-3 transition hover:bg-white"
          :class="!n.read && 'bg-[color-mix(in_srgb,var(--accent-600)_6%,transparent)]'"
          @click="markAsRead(n.comment || n.notification_type_doc)"
        >
          <span class="mt-4 size-[7px] shrink-0 rounded-full" :class="n.read ? 'bg-transparent' : 'bg-[var(--accent-600)]'" />
          <WhatsAppIcon v-if="n.type == 'WhatsApp'" class="size-10" />
          <span v-else class="flex size-11 shrink-0 items-center justify-center rounded-[13px]" :class="kindOf(n).tone">
            <GlIcon :name="kindOf(n).icon" :size="19" />
          </span>
          <div class="min-w-0 flex-1 text-[14px] leading-snug text-ink-gray-7">
            <div v-if="n.notification_text" v-html="sanitizeHTML(n.notification_text)" />
            <div v-else class="space-x-1">
              <span class="font-semibold text-ink-gray-9">{{ n.from_user.full_name }}</span>
              <span>{{ __('mentioned you in {0}', [n.reference_doctype]) }}</span>
              <span class="font-semibold text-ink-gray-9">{{ n.reference_name }}</span>
            </div>
          </div>
          <span class="num mt-0.5 shrink-0 text-[12px] text-ink-gray-5" :title="formatDateCz(n.creation) + ' ' + formatTimeCz(n.creation)">{{ timeLabel(n.creation) }}</span>
        </RouterLink>
      </template>
    </div>
    <EmptyState
      v-else
      :title="__('No New Notifications')"
      :description="__('You have no new notifications')"
      :icon="NotificationsIcon"
      width="lg"
    />
  </div>
</template>
<script setup>
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import MarkAsDoneIcon from '@/components/Icons/MarkAsDoneIcon.vue'
import NotificationsIcon from '@/components/Icons/NotificationsIcon.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import GlIcon from '@/components/GlIcon.vue'
import { formatDateCz, formatTimeCz, relativeCz } from '@/utils/glDate'
import { kindOf } from '@/composables/notificationKinds'
import {
  visible,
  notifications,
  notificationsStore,
} from '@/stores/notifications'
import { globalStore } from '@/stores/global'
import { sanitizeHTML } from '@/utils'
import { onClickOutside } from '@vueuse/core'
import { useTelemetry } from 'frappe-ui/frappe'
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const { $socket } = globalStore()
const { mark_as_read, toggle, mark_doc_as_read } = notificationsStore()
const { capture } = useTelemetry()

const target = ref(null)

const FILTERS = [
  { key: 'all', label: __('Vše') },
  { key: 'unread', label: __('Nepřečtené') },
  { key: 'mention', label: __('Zmínky') },
]
const filter = ref('all')
const unread = computed(() => (notifications.data || []).filter((n) => !n.read).length)
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
const grouped = computed(() => {
  const items = (notifications.data || []).filter((n) =>
    filter.value === 'unread' ? !n.read : filter.value === 'mention' ? n.type === 'Mention' : true,
  )
  const today = dayStart(new Date())
  const buckets = [
    { label: __('Dnes'), items: [] },
    { label: __('Včera'), items: [] },
    { label: __('Starší'), items: [] },
  ]
  for (const n of items) {
    const d = dayStart(new Date(String(n.creation).replace(' ', 'T')))
    buckets[d >= today ? 0 : d >= today - 86400000 ? 1 : 2].items.push(n)
  }
  return buckets.filter((b) => b.items.length)
})
function timeLabel(v) {
  const d = new Date(String(v).replace(' ', 'T'))
  return dayStart(d) >= dayStart(new Date()) - 86400000 ? formatTimeCz(d) : formatDateCz(d)
}
onClickOutside(
  target,
  () => {
    if (visible.value) toggle()
  },
  {
    ignore: ['#notifications-btn'],
  },
)

function markAsRead(doc) {
  capture('notification_mark_as_read')
  mark_doc_as_read(doc)
}

function markAllAsRead() {
  capture('notification_mark_all_as_read')
  mark_as_read.reload()
}

onBeforeUnmount(() => {
  $socket.off('crm_notification')
})

onMounted(() => {
  $socket.on('crm_notification', () => {
    notifications.reload()
  })
})

function getRoute(notification) {
  let params = {
    leadId: notification.reference_name,
  }
  if (notification.route_name === 'Deal') {
    params = {
      dealId: notification.reference_name,
    }
  }
  if (notification.route_name === 'Organization') {
    params = { organizationId: notification.reference_name }
  }

  return {
    name: notification.route_name,
    params: params,
    hash: notification.hash,
  }
}
</script>
