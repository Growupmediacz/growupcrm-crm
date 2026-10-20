<template>
  <!-- GrowUp: e-mail v aktivitě – směr (odeslaný / přijatý), výrazný předmět, sbalený text s „Zobrazit celý“ -->
  <div
    class="flex flex-col rounded-[18px] border bg-white/85 px-4 py-3 text-base shadow-[0_2px_12px_-6px_rgba(64,72,160,.25)]"
    :class="outgoing ? 'border-[rgba(79,70,229,.18)]' : 'border-[rgba(34,179,94,.25)]'"
  >
    <div class="flex items-center justify-between gap-2 text-ink-gray-9">
      <div class="flex min-w-0 items-center gap-2">
        <span
          class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide"
          :class="outgoing ? 'bg-[rgba(79,70,229,.1)] text-[#4338ca]' : 'bg-[rgba(34,179,94,.12)] text-[#178a4a]'"
        >
          {{ outgoing ? __('Odeslaný') : __('Přijatý') }}
        </span>
        <span class="truncate font-semibold">{{ activity.data.sender_full_name || activity.data.sender }}</span>
        <span class="hidden truncate text-sm text-ink-gray-5 sm:inline">{{ activity.data.sender }}</span>
        <Badge
          v-if="activity.communication_type == 'Automated Message'"
          :label="__('Notification')"
          variant="subtle"
          theme="green"
        />
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <Badge
          v-if="status.label"
          :label="__(status.label)"
          variant="subtle"
          :theme="status.color"
        />
        <TimelineTimestamp :date="activity.communication_date" />
        <div class="flex gap-0.5">
          <Button
            :tooltip="__('Reply')"
            variant="ghost"
            class="text-ink-gray-7"
            :icon="ReplyIcon"
            @click="reply(activity.data)"
          />
          <Button
            :tooltip="__('Reply All')"
            variant="ghost"
            :icon="ReplyAllIcon"
            class="text-ink-gray-7"
            @click="reply(activity.data, true)"
          />
        </div>
      </div>
    </div>
    <div class="mt-1.5 text-[15px] font-semibold leading-snug text-ink-gray-9">{{ activity.data.subject }}</div>
    <div class="mt-0.5 truncate text-[13px] text-ink-gray-5">
      {{ __('To') }}: {{ activity.data.recipients }}
      <template v-if="activity.data.cc"> · {{ __('CC') }}: {{ activity.data.cc }}</template>
      <template v-if="activity.data.bcc"> · {{ __('BCC') }}: {{ activity.data.bcc }}</template>
    </div>
    <div class="relative mt-2.5 border-t border-[rgba(110,120,200,.14)] pt-2" :class="!expanded && long && 'max-h-[220px] overflow-hidden'">
      <EmailContent :content="activity.data.content" />
      <div v-if="!expanded && long" class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent" />
    </div>
    <button
      v-if="long"
      type="button"
      class="mt-1 self-start text-[13px] font-semibold text-[#4F46E5] hover:underline"
      @click="expanded = !expanded"
    >
      {{ expanded ? __('Sbalit') : __('Zobrazit celý e-mail') }}
    </button>
    <div v-if="activity.data?.attachments?.length" class="mt-2 flex flex-wrap gap-2">
      <AttachmentItem
        v-for="a in activity.data.attachments"
        :key="a.file_url"
        :label="a.file_name"
        :url="a.file_url"
      />
    </div>
  </div>
</template>
<script setup>
import ReplyIcon from '@/components/Icons/ReplyIcon.vue'
import ReplyAllIcon from '@/components/Icons/ReplyAllIcon.vue'
import AttachmentItem from '@/components/AttachmentItem.vue'
import EmailContent from '@/components/Activities/EmailContent.vue'
import { Badge } from 'frappe-ui'
import TimelineTimestamp from '@/components/Activities/TimelineTimestamp.vue'
import { usersStore } from '@/stores/users'
import { htmlToText } from '@/utils'
import { reactive, computed, ref } from 'vue'

const props = defineProps({
  activity: { type: Object, default: () => ({}) },
  emailBox: { type: Object, default: () => ({}) },
})

const emailBox = reactive(props.emailBox)

// odeslaný = odesílatel je uživatel CRM, jinak přijatý (od klienta)
const { users } = usersStore()
const outgoing = computed(() => {
  const sender = (props.activity?.data?.sender || '').toLowerCase()
  return (users.data?.allUsers || []).some((u) => [u.name, u.email].some((v) => (v || '').toLowerCase() === sender))
})
const expanded = ref(false)
const long = computed(() => htmlToText(props.activity?.data?.content || '').length > 600)

function reply(email, reply_all = false) {
  emailBox.show = true
  let editor = emailBox.editor
  let message = email.content
  let recipients = email.recipients.split(',').map((r) => r.trim())
  editor.fromEmail = email.sender
  editor.toEmails = [email.sender]
  editor.cc = editor.bcc = false
  editor.ccEmails = []
  editor.bccEmails = []

  if (!email.subject.startsWith('Re:')) {
    editor.subject = `Re: ${email.subject}`
  } else {
    editor.subject = email.subject
  }

  if (reply_all) {
    let cc = email.cc?.split(',').map((r) => r.trim())
    let bcc = email.bcc?.split(',').map((r) => r.trim())

    if (cc?.length) {
      recipients = recipients.filter((r) => !cc?.includes(r))
      cc.push(...recipients)
    } else {
      cc = recipients
    }

    editor.cc = cc ? true : false
    editor.bcc = bcc ? true : false

    editor.ccEmails = cc
    editor.bccEmails = bcc
  }

  let repliedMessage = `<blockquote>${message}</blockquote>`

  editor.editor
    .chain()
    .clearContent()
    .updateAttributes('paragraph', { class: 'reply-to-content' })
    .insertContent(repliedMessage)
    .focus('all')
    .insertContentAt(0, { type: 'paragraph' })
    .focus('start')
    .run()
}

const status = computed(() => {
  let _status = props.activity?.data?.delivery_status
  let indicator_color = 'red'
  if (['Sent', 'Clicked'].includes(_status)) {
    indicator_color = 'green'
  } else if (['Sending', 'Scheduled'].includes(_status)) {
    indicator_color = 'orange'
  } else if (['Opened', 'Read'].includes(_status)) {
    indicator_color = 'blue'
  } else if (_status == 'Error') {
    indicator_color = 'red'
  }
  return { label: _status, color: indicator_color }
})
</script>
