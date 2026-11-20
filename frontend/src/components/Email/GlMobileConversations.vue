<template>
  <!-- GrowUp (zadání 2027 E1, návrh b): konverzace zakázky na telefonu – seznam vláken, klepnutí otevře vlákno
       přes celou obrazovku (GlMailThread), „Nová zpráva“ jako spodní panel s editorem. -->
  <section class="mt-4" :aria-label="__('Konverzace')">
    <div class="mb-1 flex items-center justify-between px-1">
      <h2 class="text-[22px] font-bold tracking-tight text-ink-gray-9">{{ __('Konverzace') }}</h2>
      <button type="button" class="gl-mc-new" @click="openNew"><GlIcon name="plus" :size="17" />{{ __('Nová zpráva') }}</button>
    </div>
    <div class="gl-card p-2">
      <GlThreadList :threads="threads.data?.threads || []" :loading="threads.loading" @select="open" />
    </div>
  </section>
  <GlComposer
    v-if="composeNew"
    mode="sheet"
    :draftKey="{ reference_doctype: 'CRM Lead', reference_name: docname, thread_id: '' }"
    :defaults="{ to: doc?.email ? [doc.email] : [] }"
    :doc="doc"
    :title="__('Nová zpráva')"
    @sent="sent"
    @close="composeNew = false"
  />
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlThreadList from '@/components/Email/GlThreadList.vue'
import GlComposer from '@/components/Email/GlComposer.vue'
import { restoredDraft } from '@/composables/glMail'
import { createResource } from 'frappe-ui'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  docname: { type: String, required: true },
  doc: { type: Object, default: null },
})
const emit = defineEmits(['sent'])
const router = useRouter()
const composeNew = ref(false)
const threads = createResource({
  url: 'growupcrm.mail_threads.list_threads',
  params: { reference_doctype: 'CRM Lead', reference_name: props.docname },
  auto: true,
})
watch(restoredDraft, (r) => r && r.key.reference_name === props.docname && !r.key.thread_id && (composeNew.value = true))

function open(id) {
  router.push({ name: 'GlMailThread', params: { leadId: props.docname, threadId: id } })
}
function openNew() {
  composeNew.value = true
}
function sent(r) {
  composeNew.value = false
  threads.reload()
  emit('sent', r)
}
defineExpose({ openNew, reload: () => threads.reload() })
</script>
<style scoped>
.gl-mc-new { display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit); padding: 0 14px; border-radius: 999px; font-size: 15px; font-weight: 600; color: var(--accent-700); background: var(--accent-soft); }
.gl-mc-new:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
