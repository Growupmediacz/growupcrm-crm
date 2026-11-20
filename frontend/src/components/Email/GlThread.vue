<template>
  <!-- GrowUp (zadání 2027 E1): vlákno e-mailů – starší zprávy sbalené do řádků, poslední celá,
       automatické odpovědi a události jako malé středové řádky; pod vláknem místo pro návrh agenta a odpověď. -->
  <section class="gl-thread" :aria-label="__('Vlákno: {0}', [thread?.subject || ''])">
    <header class="gl-thread-head">
      <div class="min-w-0 flex-1">
        <h2 class="text-[20px] font-[650] leading-tight text-ink-gray-9">{{ thread?.subject || __('(bez předmětu)') }}</h2>
        <p v-if="thread" class="mt-1 text-[14px] text-[color:var(--text-2)]">
          {{ countLabel }}<template v-if="counterpart"> · {{ counterpart }}</template><template v-if="lastAt"> · {{ __('poslední {0}', [lastAt]) }}</template>
        </p>
      </div>
      <slot name="head-actions" />
    </header>

    <GlSkeleton v-if="loading && !thread" :rows="3" />
    <div v-else-if="thread" class="gl-thread-msgs">
      <template v-for="item in items" :key="item.key">
        <button v-if="item.kind === 'more'" type="button" class="gl-thread-more" @click="showAll = true">
          <span class="gl-thread-more-n">{{ item.count }}</span>{{ __('starších zpráv – zobrazit') }}
        </button>
        <div v-else-if="item.kind === 'event'" class="gl-thread-event">
          <button type="button" class="gl-thread-event-btn" :aria-expanded="!!openMap[item.msg.name]" @click="toggle(item.msg.name)">
            <GlIcon name="clock" :size="15" />
            {{ __('Automatická odpověď od {0}', [item.msg.sender_name || item.msg.sender]) }} · {{ mailTime(item.msg.at) }}
          </button>
          <GlMessage v-if="openMap[item.msg.name]" v-model:open="openMap[item.msg.name]" :message="item.msg" :actions="false" class="text-left" />
        </div>
        <GlMessage
          v-else
          v-model:open="openMap[item.msg.name]"
          :message="item.msg"
          @reply="(mode) => $emit('reply', { mode, message: item.msg })"
        />
      </template>
    </div>
    <slot name="below" />
  </section>
</template>
<script setup>
import GlIcon from '@/components/GlIcon.vue'
import GlSkeleton from '@/components/GlSkeleton.vue'
import GlMessage from '@/components/Email/GlMessage.vue'
import { mailTime } from '@/composables/glMail'
import { computed, reactive, ref, watch } from 'vue'

const props = defineProps({
  thread: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})
defineEmits(['reply'])

const openMap = reactive({})
const showAll = ref(false)
const msgs = computed(() => props.thread?.messages || [])

// poslední (a každá odesílaná) zpráva je rozbalená, ostatní sbalené
watch(
  () => props.thread?.id + ':' + msgs.value.length,
  () => {
    showAll.value = msgs.value.length <= 6
    const human = msgs.value.filter((m) => !m.automated)
    const last = human[human.length - 1] || msgs.value[msgs.value.length - 1]
    msgs.value.forEach((m) => {
      if (!(m.name in openMap)) openMap[m.name] = m === last || m.pending
    })
    if (last) openMap[last.name] = true
  },
  { immediate: true },
)

const items = computed(() => {
  const list = msgs.value.map((m) => ({ kind: m.automated ? 'event' : 'msg', key: m.name, msg: m }))
  if (showAll.value || list.length <= 6) return list
  // první zpráva, „N starších“, poslední tři
  const hidden = list.slice(1, list.length - 3)
  return [list[0], { kind: 'more', key: 'more', count: hidden.length }, ...list.slice(list.length - 3)]
})

function toggle(name) {
  openMap[name] = !openMap[name]
}

const countLabel = computed(() => {
  const n = msgs.value.length
  return n === 1 ? __('1 zpráva') : n < 5 ? __('{0} zprávy', [n]) : __('{0} zpráv', [n])
})
const counterpart = computed(() => {
  const m = [...msgs.value].reverse().find((x) => x.sent_or_received === 'Received')
  return m ? m.sender_name || m.sender : ''
})
const lastAt = computed(() => {
  const m = msgs.value[msgs.value.length - 1]
  return m ? mailTime(m.at) : ''
})

defineExpose({ expandAll: () => (showAll.value = true) })
</script>
<style scoped>
.gl-thread { container: gl-thread / inline-size; }
.gl-thread-head { display: flex; align-items: flex-start; gap: 12px; padding-bottom: 12px; }
.gl-thread-msgs { border-top: 1px solid var(--line); }
.gl-thread-more {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  min-height: var(--hit);
  padding: 8px 0;
  border-top: 1px solid var(--line);
  font-size: 14px;
  color: var(--text-2);
}
.gl-thread-more:hover { color: var(--text-1); }
.gl-thread-more:focus-visible { outline: none; box-shadow: var(--focus-ring); border-radius: 12px; }
.gl-thread-more-n {
  display: inline-flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--field-border);
  font-weight: 600;
  color: var(--text-1);
}
.gl-thread-event { border-top: 1px solid var(--line); text-align: center; }
.gl-thread-event-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: var(--hit);
  padding: 0 12px;
  border-radius: 12px;
  font-size: 13.5px;
  color: var(--text-2);
}
.gl-thread-event-btn:hover { color: var(--text-1); }
.gl-thread-event-btn:focus-visible { outline: none; box-shadow: var(--focus-ring); }
</style>
