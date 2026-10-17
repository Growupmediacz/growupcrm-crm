<template>
  <!-- GrowUp: komentář v novém designu (skleněná karta, pilulková tlačítka, jen základní formátování) -->
  <Editor
    ref="commentEditor"
    v-model="content"
    :extensions="extensions"
    :placeholder="placeholder"
    :editable="editable"
    :upload-function="(file) => uploadFile(file, doctype, modelValue.name)"
  >
    <div class="relative w-full" :class="editable && 'px-4 pb-3'">
      <div
        :class="
          editable &&
          'gl-comment rounded-[18px] border border-white/90 bg-white/80 shadow-[0_6px_24px_-12px_rgba(64,72,160,.35)] focus-within:border-[rgba(79,70,229,.45)] focus-within:shadow-[0_0_0_3px_rgba(79,70,229,.12)]'
        "
      >
        <EditorContent
          :class="[
            'prose-sm max-w-none',
            editable && 'max-h-[40vh] min-h-[5.5rem] overflow-y-auto px-4 pb-2 pt-3 text-[15px]',
          ]"
        />
        <EditorTableMenu />
        <div v-if="editable" class="flex flex-col gap-2">
          <div v-if="attachments.length" class="flex flex-wrap gap-2 px-4">
            <AttachmentItem v-for="a in attachments" :key="a.file_url" :label="a.file_name">
              <template #suffix>
                <span class="lucide-x h-3.5" aria-hidden="true" @click.stop="removeAttachment(a)" />
              </template>
            </AttachmentItem>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-[rgba(110,120,200,.14)] px-2.5 py-2">
            <div class="gl-comment-tools flex items-center gap-0.5 overflow-x-auto">
              <FileUploader
                :upload-args="{ doctype: doctype, docname: modelValue.name, private: true }"
                @success="(f) => attachments.push(f)"
              >
                <template #default="{ openFileSelector }">
                  <Button :tooltip="__('Přiložit soubor')" variant="ghost" :icon="AttachmentIcon" @click="openFileSelector()" />
                </template>
              </FileUploader>
              <IconPicker v-slot="{ togglePopover }" v-model="emoji" @update:modelValue="() => appendEmoji()">
                <Button :tooltip="__('Vložit emoji')" :icon="SmileIcon" variant="ghost" @click="togglePopover()" />
              </IconPicker>
              <span class="mx-1 h-5 w-px bg-[rgba(110,120,200,.2)]" />
              <EditorFixedMenu :items="commentToolbar" />
            </div>
            <div class="ml-auto flex items-center gap-2">
              <button class="gl-quick !h-9" v-bind="discardButtonProps || {}">{{ __('Zrušit') }}</button>
              <button
                class="inline-flex h-9 items-center gap-2 rounded-full bg-[#4F46E5] px-4 text-[14px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(79,70,229,.7)] disabled:opacity-50"
                :disabled="submitButtonProps?.disabled"
                @click="submitButtonProps?.onClick?.()"
              >
                {{ __('Přidat komentář') }}
                <kbd class="rounded bg-white/20 px-1.5 text-[11px] font-medium">{{ submitShortcutLabel }}</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Editor>
</template>
<script setup>
import IconPicker from '@/components/IconPicker.vue'
import SmileIcon from '@/components/Icons/SmileIcon.vue'
import AttachmentIcon from '@/components/Icons/AttachmentIcon.vue'
import AttachmentItem from '@/components/AttachmentItem.vue'
import {
  buildEditorExtensions,
  commentToolbar,
  uploadFile,
} from '@/components/editor/config'
import { submitShortcutLabel } from '@/utils'
import { usersStore } from '@/stores/users'
import { useTelemetry } from 'frappe-ui/frappe'
import { FileUploader } from 'frappe-ui'
import {
  Editor,
  EditorContent,
  EditorFixedMenu,
  EditorTableMenu,
} from 'frappe-ui/editor'
import { ref, computed } from 'vue'

defineProps({
  placeholder: { type: String, default: null },
  editable: { type: Boolean, default: true },
  doctype: { type: String, default: 'CRM Lead' },
  editorProps: { type: Object, default: () => ({}) },
  submitButtonProps: { type: Object, default: () => ({}) },
  discardButtonProps: { type: Object, default: () => ({}) },
})

const modelValue = defineModel({ type: Object })
const attachments = defineModel('attachments', {
  type: Array,
  default: () => [],
})
const content = defineModel('content', { type: String, default: '' })

const { users: usersList } = usersStore()
const { capture } = useTelemetry()

const commentEditor = ref(null)
const emoji = ref('')

const editor = computed(() => commentEditor.value?.editor)

const users = computed(
  () =>
    usersList.data?.crmUsers
      ?.filter((user) => user.enabled)
      .map((user) => ({
        id: user.name,
        label: user.full_name?.trim() || user.name,
      })) || [],
)

const extensions = buildEditorExtensions({ mentions: () => users.value })

function appendEmoji() {
  editor.value.commands.insertContent(emoji.value)
  editor.value.commands.focus()
  emoji.value = ''
  capture('emoji_inserted_in_comment', { emoji: emoji.value })
}

function removeAttachment(attachment) {
  attachments.value = attachments.value.filter((a) => a !== attachment)
}

defineExpose({ editor })
</script>
