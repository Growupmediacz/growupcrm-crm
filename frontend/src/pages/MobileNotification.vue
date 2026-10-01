<!-- eslint-disable vue/no-v-html -->
<template>
  <!-- GrowUp (design 1. kolo MOznameni): Oznámení – Vše / Nepřečtené, skupiny Dnes a Včera, ikona podle typu, tečka u nepřečtených -->
  <div class="flex min-h-0 flex-1 flex-col gap-3 px-4 pb-4 pt-3 text-ink-gray-9">
    <div class="flex items-center justify-between">
      <router-link :to="{ name: 'More' }" class="text-[16px] font-semibold text-[#4338ca]">{{ __('Zrušit') }}</router-link>
      <h1 class="text-[18px] font-bold">{{ __('Oznámení') }}</h1>
      <button class="inline-flex h-9 items-center rounded-full bg-[#4F46E5] px-4 text-[14px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)]" @click="mark_as_read.reload()">{{ __('Hotovo') }}</button>
    </div>
    <div class="gl-seg flex w-full">
      <button class="gl-seg-btn flex-1 justify-center" :class="tab === 'all' && 'gl-seg-on'" @click="tab = 'all'">{{ __('Vše') }}</button>
      <button class="gl-seg-btn flex-1 justify-center" :class="tab === 'unread' && 'gl-seg-on'" @click="tab = 'unread'">{{ __('Nepřečtené') }} <span v-if="unread" class="num ml-1">{{ unread }}</span></button>
    </div>
    <GlSkeleton v-if="notifications.loading && !notifications.data" :rows="4" />
    <GlEmptyState v-else-if="!shown.length" icon="bell" :title="tab === 'unread' ? __('Vše přečteno') : __('Zatím žádná oznámení')" :text="__('Nové události se ukážou tady.')" />
    <div v-else class="flex flex-1 flex-col gap-1 overflow-y-auto">
      <template v-for="g in groups" :key="g.label">
        <div class="mt-2 px-1 text-[13px] font-semibold text-[var(--text-3,#5B6285)]">{{ g.label }}</div>
        <div class="gl-card overflow-hidden !rounded-[20px]">
          <RouterLink v-for="(n, i) in g.items" :key="n.comment || n.notification_type_doc" :to="getRoute(n)" class="flex items-start gap-3 px-4 py-3" :class="i && 'border-t border-[rgba(110,120,200,.12)]'" @click="mark_doc_as_read(n.comment || n.notification_type_doc)">
            <WhatsAppIcon v-if="n.type == 'WhatsApp'" class="size-10 shrink-0" />
            <span v-else class="flex size-10 shrink-0 items-center justify-center rounded-xl" :class="kindOf(n).tone"><GlIcon :name="kindOf(n).icon" :size="18" /></span>
            <div class="min-w-0 flex-1 text-[15px] leading-snug">
              <div v-if="n.notification_text" class="[&_*]:!text-[15px]" v-html="sanitizeHTML(n.notification_text)" />
              <div v-else class="space-x-1 text-ink-gray-5"><span class="font-semibold text-ink-gray-9">{{ n.from_user.full_name }}</span><span>{{ __('mentioned you in {0}', [n.reference_doctype]) }}</span><span class="font-semibold text-ink-gray-9">{{ n.reference_name }}</span></div>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-1.5">
              <span class="num text-[12px] text-ink-gray-5">{{ relativeCz(n.creation) }}</span>
              <span v-if="!n.read" class="size-2 rounded-full bg-[#4F46E5]" />
            </div>
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlEmptyState from '@/components/GlEmptyState.vue'
import WhatsAppIcon from '@/components/Icons/WhatsAppIcon.vue'
import { kindOf } from '@/composables/notificationKinds'
import { notifications, notificationsStore } from '@/stores/notifications'
import { globalStore } from '@/stores/global'
import { sanitizeHTML } from '@/utils'
import { relativeCz } from '@/utils/glDate'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { $socket } = globalStore()
const { mark_as_read, mark_doc_as_read } = notificationsStore()
const tab = ref('all')
const unread = computed(() => (notifications.data || []).filter((n) => !n.read).length)
const shown = computed(() => (notifications.data || []).filter((n) => tab.value === 'all' || !n.read))
const groups = computed(() => {
  const today = new Date().toDateString()
  const out = []
  for (const n of shown.value) {
    const d = new Date(String(n.creation).replace(' ', 'T'))
    const label = d.toDateString() === today ? __('Dnes') : __('Dříve')
    let g = out.find((x) => x.label === label)
    if (!g) out.push((g = { label, items: [] }))
    g.items.push(n)
  }
  return out
})

onBeforeUnmount(() => $socket.off('crm_notification'))
onMounted(() => $socket.on('crm_notification', () => notifications.reload()))

function getRoute(n) {
  let params = { leadId: n.reference_name }
  if (n.route_name === 'Deal') params = { dealId: n.reference_name }
  return { name: n.route_name, params, hash: '#' + (n.comment || n.notification_type_doc) }
}
</script>
