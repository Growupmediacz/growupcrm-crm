<template>
  <!-- GrowUp (zadání 2027 E1): jedna zpráva vlákna – sbalená do řádku, nebo celá (hlavička, tělo, citace, přílohy, akce) -->
  <article class="gl-msg" :class="[open && 'is-open', message.pending && 'is-pending']" :aria-label="__('Zpráva od {0}', [who])">
    <button
      type="button"
      class="gl-msg-head"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span class="gl-msg-av" :class="message.sent_or_received === 'Sent' && 'is-us'" aria-hidden="true">{{ initials(who) }}</span>
      <span class="min-w-0 flex-1">
        <span class="flex min-w-0 items-baseline gap-2">
          <b class="truncate text-[15px] font-semibold text-ink-gray-9">{{ who }}</b>
          <span v-if="open && message.sender && message.sender !== who" class="hidden truncate text-[13px] text-ink-gray-5 sm:inline">{{ message.sender }}</span>
        </span>
        <span v-if="!open" class="block truncate text-[14.5px] text-[color:var(--text-2)]">{{ message.snippet || __('(bez textu)') }}</span>
        <span v-else-if="recipientsLine" class="block truncate text-[13px] text-[color:var(--text-2)]">{{ recipientsLine }}</span>
      </span>
      <span class="flex shrink-0 items-center gap-2">
        <GlIcon v-if="message.attachments?.length && !open" name="link" :size="15" class="text-ink-gray-5" :aria-label="__('Přílohy')" />
        <span v-if="message.pending" class="gl-msg-chip is-warn">{{ __('Odesílá se') }}</span>
        <span v-else-if="open && statusLabel" class="gl-msg-chip">{{ statusLabel }}</span>
        <time class="num text-[13px] text-[color:var(--text-2)]" :datetime="message.at">{{ mailTime(message.at) }}</time>
      </span>
    </button>
    <div class="gl-msg-full" :class="open && 'is-open'">
      <div>
        <div v-if="open || wasOpened" class="gl-msg-body">
          <GlMailFrame :html="message.html" :title="__('E-mail: {0}', [message.subject || who])" />
          <template v-if="message.quote_html">
            <button type="button" class="gl-msg-quote-btn" :aria-expanded="showQuote" @click="showQuote = !showQuote">
              <GlIcon name="more" :size="16" />{{ showQuote ? __('Skrýt citaci') : __('Zobrazit citaci') }}
            </button>
            <GlMailFrame v-if="showQuote" :html="message.quote_html" :title="__('Citace')" class="mt-2" />
          </template>
          <div v-if="message.attachments?.length" class="mt-3 flex flex-wrap gap-2">
            <a
              v-for="a in message.attachments"
              :key="a.name"
              :href="a.file_url"
              target="_blank"
              rel="noopener"
              class="gl-msg-att"
            >
              <GlIcon name="doc" :size="16" /><span class="truncate">{{ a.file_name }}</span>
              <span v-if="a.file_size" class="text-[13px] font-normal text-[color:var(--text-2)]">· {{ fileSize(a.file_size) }}</span>
            </a>
          </div>
          <div v-if="actions" class="mt-3 flex flex-wrap gap-2">
            <button type="button" class="gl-msg-act" @click="$emit('reply', 'reply')"><GlIcon name="reply" :size="16" />{{ __('Odpovědět') }}</button>
            <button v-if="multi" type="button" class="gl-msg-act" @click="$emit('reply', 'all')"><GlIcon name="users" :size="16" />{{ __('Odpovědět všem') }}</button>
            <button type="button" class="gl-msg-act" @click="$emit('reply', 'forward')"><GlIcon name="arrow" :size="16" />{{ __('Přeposlat') }}</button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlMailFrame from '@/components/Email/GlMailFrame.vue'
import { fileSize, initials, mailTime } from '@/composables/glMail'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  message: { type: Object, required: true },
  actions: { type: Boolean, default: true },
})
defineEmits(['reply'])
const open = defineModel('open', { type: Boolean, default: false })
const wasOpened = ref(open.value)
watch(open, (v) => v && (wasOpened.value = true))
const showQuote = ref(false)

const who = computed(() => props.message.sender_name || props.message.sender || __('Neznámý odesílatel'))
const names = (list) => (list || []).map((r) => (typeof r === 'string' ? r : r.name || r.email)).join(', ')
const recipientsLine = computed(() => {
  const m = props.message
  const parts = []
  if (m.recipients?.length) parts.push(__('Komu: {0}', [names(m.recipients)]))
  if (m.cc?.length) parts.push(__('Kopie: {0}', [names(m.cc)]))
  if (m.bcc?.length) parts.push(__('Skrytá: {0}', [names(m.bcc)]))
  return parts.join(' · ')
})
const multi = computed(() => (props.message.recipients?.length || 0) + (props.message.cc?.length || 0) > 1)
const statusLabel = computed(() => {
  const m = props.message
  if (m.sent_or_received !== 'Sent') return ''
  if (m.read) return __('Přečteno')
  if (m.delivery_status === 'Sent') return __('Odesláno')
  if (m.delivery_status === 'Error' || m.delivery_status === 'Bounced') return __('Nedoručeno')
  return ''
})
</script>
<style scoped>
.gl-msg { border-top: 1px solid var(--line); }
.gl-msg:first-child { border-top: 0; }
.gl-msg-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  min-height: 60px;
  padding: 8px 8px;
  margin: 0 -8px;
  width: calc(100% + 16px);
  border-radius: 12px;
  text-align: left;
}
.gl-msg-head:hover { background: var(--fill-tinted, color-mix(in srgb, var(--c-tint) 7.5%, transparent)); }
.gl-msg-head:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.gl-msg-av {
  display: inline-flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-2);
  background: var(--state-them-bg);
}
.gl-msg-av.is-us { color: var(--accent-700); background: var(--accent-soft); }
.gl-msg-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  background: var(--state-them-bg);
}
.gl-msg-chip.is-warn { color: var(--warn-fg); background: var(--warn-bg); }
.gl-msg-full { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--t-panel) var(--ease-panel); }
.gl-msg-full > div { overflow: hidden; min-height: 0; }
.gl-msg-full.is-open { grid-template-rows: 1fr; }
.gl-msg-body { padding: 4px 0 20px 48px; max-width: calc(var(--read-w) + 48px); }
@container gl-thread (max-width: 680px) { .gl-msg-body { padding-left: 0; } }
@media (max-width: 767px) { .gl-msg-body { padding-left: 0; } }
.gl-msg-quote-btn, .gl-msg-act, .gl-msg-att {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit-sm);
  padding: 0 14px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-1);
}
.gl-msg-quote-btn { margin-top: 8px; color: var(--text-2); background: var(--state-them-bg); min-height: var(--hit); }
.gl-msg-act { border: 1px solid var(--field-border); background: white; }
.gl-msg-att { border: 1px solid var(--field-border); background: white; max-width: 100%; min-height: var(--hit); font-weight: 600; }
.gl-msg-quote-btn:hover, .gl-msg-act:hover, .gl-msg-att:hover { border-color: var(--accent-200); }
.gl-msg-quote-btn:focus-visible, .gl-msg-act:focus-visible, .gl-msg-att:focus-visible { outline: none; box-shadow: var(--focus-ring); }
.is-pending { opacity: 0.85; }
</style>
