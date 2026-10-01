<!-- eslint-disable vue/no-v-html -->
<template>
  <div
    v-if="visible"
    ref="target"
    class="gl-sheet fixed right-5 top-[68px] z-30 max-h-[70vh] w-[380px] overflow-hidden rounded-[22px]"
  >
    <div class="flex max-h-[70vh] flex-col text-ink-gray-9">
      <div class="z-20 flex items-center justify-between border-b px-4 py-2.5">
        <div class="text-lg-medium text-ink-gray-8">
          {{ __('Notifications') }}
        </div>
        <div class="flex gap-1">
          <Button
            :tooltip="__('Mark all as read')"
            :icon="MarkAsDoneIcon"
            variant="ghost"
            @click="markAllAsRead"
          />
          <Button
            :tooltip="__('Close')"
            icon="x"
            variant="ghost"
            @click="() => toggle()"
          />
        </div>
      </div>
      <div
        v-if="notifications.data?.length"
        class="divide-y divide-outline-elevation-2 overflow-auto text-base"
      >
        <RouterLink
          v-for="n in notifications.data"
          :key="n.comment"
          :to="getRoute(n)"
          class="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 hover:bg-surface-gray-2"
          @click="markAsRead(n.comment || n.notification_type_doc)"
        >
          <div class="mt-1 flex items-center gap-2.5">
            <div
              class="size-[5px] rounded-full"
              :class="[n.read ? 'bg-transparent' : 'bg-surface-gray-10']"
            />
            <WhatsAppIcon v-if="n.type == 'WhatsApp'" class="size-7" />
            <!-- GrowUp (design 2. kolo, oprava 18): ikona podle typu místo avataru -->
            <span v-else class="flex size-9 items-center justify-center rounded-xl" :class="kindOf(n).tone">
              <GlIcon :name="kindOf(n).icon" :size="17" />
            </span>
          </div>
          <div>
            <div
              v-if="n.notification_text"
              v-html="sanitizeHTML(n.notification_text)"
            />
            <div v-else class="mb-2 space-x-1 leading-5 text-ink-gray-5">
              <span class="font-medium text-ink-gray-9">
                {{ n.from_user.full_name }}
              </span>
              <span>
                {{ __('mentioned you in {0}', [n.reference_doctype]) }}
              </span>
              <span class="font-medium text-ink-gray-9">
                {{ n.reference_name }}
              </span>
            </div>
            <div class="text-sm text-ink-gray-5" :title="formatDateCz(n.creation) + ' ' + formatTimeCz(n.creation)">
              {{ relativeCz(n.creation) }}
            </div>
          </div>
        </RouterLink>
      </div>
      <EmptyState
        v-else
        :title="__('No New Notifications')"
        :description="__('You have no new notifications')"
        :icon="NotificationsIcon"
        width="lg"
      />
    </div>
  </div>
</template>
<script setup>
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import MarkAsDoneIcon from '@/components/Icons/MarkAsDoneIcon.vue'
import NotificationsIcon from '@/components/Icons/NotificationsIcon.vue'
import EmptyState from '@/components/ListViews/EmptyState.vue'
import GlIcon from '@/components/GlIcon.vue'
import { formatDateCz, formatTimeCz, relativeCz } from '@/utils/glDate'
import {
  visible,
  notifications,
  notificationsStore,
} from '@/stores/notifications'
import { globalStore } from '@/stores/global'
import { sanitizeHTML } from '@/utils'
import { onClickOutside } from '@vueuse/core'
import { useTelemetry } from 'frappe-ui/frappe'
import { ref, onMounted, onBeforeUnmount } from 'vue'

const { $socket } = globalStore()
const { mark_as_read, toggle, mark_doc_as_read } = notificationsStore()
const { capture } = useTelemetry()

const target = ref(null)
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

const KINDS = {
  task: { icon: 'check', tone: 'bg-[rgba(234,170,8,.18)] text-[#915200]' },
  event: { icon: 'cal', tone: 'bg-[rgba(59,110,246,.13)] text-[#2e5bd8]' },
  call: { icon: 'phone', tone: 'bg-[rgba(249,115,22,.14)] text-[#c2410c]' },
  email: { icon: 'mail', tone: 'bg-[rgba(20,160,190,.13)] text-[#0b7488]' },
  won: { icon: 'star', tone: 'bg-[rgba(34,179,94,.14)] text-[#15803d]' },
  assign: { icon: 'brief', tone: 'bg-[rgba(79,70,229,.1)] text-[#4338ca]' },
  mention: { icon: 'reply', tone: 'bg-[rgba(110,120,200,.12)] text-[#4a5173]' },
}
function kindOf(n) {
  const text = (n.notification_text || '').toLowerCase()
  if (n.notification_type_doctype === 'Event' || n.reference_doctype === 'Event') return KINDS.event
  if (n.type === 'Task' || n.notification_type_doctype === 'CRM Task') return KINDS.task
  if (n.notification_type_doctype === 'CRM Call Log') return KINDS.call
  if (text.includes('vyhr')) return KINDS.won
  if (n.type === 'Assignment') return KINDS.assign
  if (n.notification_type_doctype === 'Communication') return KINDS.email
  return KINDS.mention
}

function getRoute(notification) {
  let params = {
    leadId: notification.reference_name,
  }
  if (notification.route_name === 'Deal') {
    params = {
      dealId: notification.reference_name,
    }
  }

  return {
    name: notification.route_name,
    params: params,
    hash: notification.hash,
  }
}
</script>
