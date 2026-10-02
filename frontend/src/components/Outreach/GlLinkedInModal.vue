<template>
  <!-- GrowUp (design 2. kolo, O9): krok LinkedIn – zpráva ke zkopírování, otevření profilu, Přeskočit / Označit jako hotové.
       LinkedIn neumíme odeslat za uživatele, zprávu vloží ručně. -->
  <Dialog v-model:open="show" :options="{ size: 'lg' }">
    <template #body-title>
      <div class="flex items-center gap-3">
        <span class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(79,70,229,.12)] text-[#3b30b8]"><GlIcon name="link" :size="22" /></span>
        <div class="min-w-0">
          <h3 class="text-2xl font-semibold leading-6 text-ink-gray-9">{{ __('LinkedIn zpráva') }}</h3>
          <span class="mt-1 block truncate text-[13px] text-ink-gray-5">{{ item?.campaign_name }} · {{ __('krok {0}', [(item?.step_index ?? 0) + 1]) }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <div v-if="item" class="flex flex-col gap-4">
        <div class="flex items-center gap-3 rounded-2xl bg-[rgba(110,120,200,.1)] px-4 py-3">
          <span class="flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold" :style="avatarTone(item.contact_name)">{{ initials(item.contact_name) }}</span>
          <div class="min-w-0 flex-1"><div class="truncate text-[15px] font-bold text-ink-gray-9">{{ item.contact_name }}</div><div class="truncate text-[12.5px] text-ink-gray-5">{{ item.designation }}<template v-if="item.designation && item.organization"> · </template>{{ item.organization }}</div></div>
          <a :href="profileUrl" target="_blank" rel="noopener" class="gl-quick shrink-0"><GlIcon name="external" :size="15" />{{ __('Otevřít profil') }}</a>
        </div>
        <label>
          <span class="gl-label">{{ __('Zpráva') }}</span>
          <textarea v-model="text" class="gl-field gl-text w-full" rows="5" lang="cs" />
        </label>
        <div class="flex items-center gap-3">
          <button class="gl-quick !h-11 !px-5 !text-[15px]" @click="copy"><GlIcon name="copy" :size="16" />{{ __('Zkopírovat zprávu') }}</button>
          <span v-if="copied" class="flex items-center gap-1 text-[13px] font-semibold text-[#0f6b32]"><GlIcon name="check" :size="14" />{{ __('Zkopírováno') }}</span>
        </div>
        <p class="text-[13px] text-ink-gray-5">{{ __('LinkedIn neumíme odeslat za vás. Zprávu vložte do LinkedInu a pak krok označte jako hotový.') }}</p>
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Přeskočit')" @click="$emit('skip'), (show = false)" />
        <Button variant="solid" iconLeft="check" :label="__('Označit jako hotové')" @click="$emit('done'), (show = false)" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { avatarTone, initials, plain } from '@/composables/outreach'
import { Button, Dialog } from 'frappe-ui'
import { computed, ref, watch } from 'vue'

const props = defineProps({ item: { type: Object, default: null } })
defineEmits(['done', 'skip'])
const show = defineModel({ type: Boolean })
const text = ref('')
const copied = ref(false)
watch(() => props.item, (i) => ((text.value = plain(i?.body || '')), (copied.value = false)), { immediate: true })

const profileUrl = computed(() => {
  const url = props.item?.linkedin
  if (url && /^https?:\/\//.test(url)) return url
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent([props.item?.contact_name, props.item?.organization].filter(Boolean).join(' '))}`
})
async function copy() {
  try {
    await navigator.clipboard.writeText(text.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}
</script>
