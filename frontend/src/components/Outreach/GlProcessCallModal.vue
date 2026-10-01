<template>
  <!-- GrowUp (design 2. kolo, O9): krok Hovor z Outreach – výsledek a poznámka, uloží se jako zápis u kontaktu -->
  <Dialog v-model:open="show" :title="__('Zapsat hovor')">
    <template #default>
      <div v-if="item" class="flex flex-col gap-4">
        <div class="text-[14px] text-ink-gray-7"><b class="text-ink-gray-9">{{ item.contact_name }}</b> · {{ item.organization }}</div>
        <div>
          <span class="gl-label">{{ __('Výsledek') }}</span>
          <div class="flex flex-wrap gap-2">
            <button v-for="o in OUTCOMES" :key="o" type="button" class="gl-chip h-9 rounded-full px-3.5 text-[14px]" :class="outcome === o && 'gl-chip-on'" @click="outcome = o">{{ __(o) }}</button>
          </div>
        </div>
        <label>
          <span class="gl-label">{{ __('Poznámka') }}</span>
          <textarea v-model="note" class="gl-field gl-text w-full" rows="3" lang="cs" :placeholder="__('Co jste se dozvěděli, na čem jste se domluvili')" />
        </label>
      </div>
    </template>
    <template #actions>
      <div class="flex justify-end gap-2">
        <Button :label="__('Zrušit')" @click="show = false" />
        <Button variant="solid" :label="__('Uložit a odškrtnout')" :disabled="!outcome" @click="save" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { Button, Dialog } from 'frappe-ui'
import { ref } from 'vue'

defineProps({ item: { type: Object, default: null } })
const emit = defineEmits(['done'])
const show = defineModel({ type: Boolean })
const OUTCOMES = ['Domluvili schůzku', 'Zavolat později', 'Nebral', 'Nemá zájem']
const outcome = ref('')
const note = ref('')

function save() {
  emit('done', { outcome: outcome.value, note: note.value })
  show.value = false
}
</script>
