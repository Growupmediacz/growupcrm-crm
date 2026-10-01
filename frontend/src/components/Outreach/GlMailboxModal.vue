<template>
  <!-- GrowUp (design 2. kolo, O7): Připojit schránku – krokový průvodce Odchozí pošta → Příchozí pošta → Podpis -->
  <Dialog v-model:open="show" :title="__('Připojit schránku')" :options="{ size: 'lg' }">
    <template #default>
      <p class="-mt-3 mb-4 text-[13px] text-ink-gray-5">{{ __('E-maily odcházejí z vaší adresy, odpovědi chodí zpět do CRM.') }}</p>
      <ol class="mb-5 flex items-center gap-2 text-[13px] font-semibold">
        <template v-for="(s, i) in STEPS" :key="s">
          <li class="flex items-center gap-2" :class="step === i ? 'text-ink-gray-9' : 'text-ink-gray-5'">
            <span class="flex size-7 items-center justify-center rounded-full text-[12px]" :class="step === i ? 'bg-[#4F46E5] text-white' : step > i ? 'bg-[rgba(34,179,94,.18)] text-[#15803d]' : 'bg-[rgba(110,120,200,.14)]'">{{ step > i ? '✓' : i + 1 }}</span>{{ s }}
          </li>
          <span v-if="i < STEPS.length - 1" class="h-px flex-1 bg-[rgba(110,120,200,.25)]" />
        </template>
      </ol>

      <div v-if="step === 0" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-[1fr_110px] gap-3">
          <label><span class="gl-label">{{ __('Server SMTP') }}</span><input v-model="f.smtp_host" class="gl-field w-full" placeholder="smtp.poskytovatel.cz" /></label>
          <label><span class="gl-label">{{ __('Port') }}</span><input v-model="f.smtp_port" class="gl-field w-full tabular-nums" inputmode="numeric" /></label>
        </div>
        <div>
          <span class="gl-label">{{ __('Zabezpečení') }}</span>
          <div class="gl-segf" role="group"><button v-for="o in SEC" :key="o" type="button" :aria-pressed="f.smtp_security === o" @click="f.smtp_security = o">{{ o }}</button></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label><span class="gl-label">{{ __('Uživatel') }}</span><input v-model="f.smtp_user" class="gl-field w-full" autocomplete="off" /></label>
          <label>
            <span class="gl-label">{{ __('Heslo aplikace') }}</span>
            <input v-model="f.smtp_password" class="gl-field w-full" type="password" autocomplete="new-password" :placeholder="data?.has_password ? '••••••••••' : ''" />
          </label>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Button iconLeft="refresh-cw" :loading="testing" @click="test">{{ __('Otestovat spojení') }}</Button>
          <span class="text-[13px] text-ink-gray-5">{{ __('Pošleme testovací e-mail sami sobě') }}</span>
        </div>
        <div v-if="result" class="flex items-start gap-3 rounded-2xl px-4 py-3" :class="result.ok ? 'bg-[rgba(34,179,94,.14)]' : 'bg-[rgba(200,50,31,.1)]'">
          <GlIcon :name="result.ok ? 'check' : 'alert'" :size="18" :class="result.ok ? 'text-[#15803d]' : 'text-[#c8321f]'" />
          <div class="text-[14px]"><b :class="result.ok ? 'text-[#15803d]' : 'text-[#c8321f]'">{{ result.ok ? __('Spojení funguje') : __('Spojení se nepodařilo') }}</b><br /><span class="text-ink-gray-7">{{ result.ok ? __('Testovací e-mail odešel za {0} s', [String(result.seconds).replace('.', ',')]) : result.message }}</span></div>
        </div>
        <p class="text-[13px] text-ink-gray-5">{{ __('Heslo ukládáme šifrovaně. U Gmailu a Microsoft 365 použijte heslo aplikace.') }}</p>
      </div>

      <div v-else-if="step === 1" class="flex flex-col gap-3.5">
        <div class="grid grid-cols-[1fr_110px] gap-3">
          <label><span class="gl-label">{{ __('Server IMAP') }}</span><input v-model="f.imap_host" class="gl-field w-full" placeholder="imap.poskytovatel.cz" /></label>
          <label><span class="gl-label">{{ __('Port') }}</span><input v-model="f.imap_port" class="gl-field w-full tabular-nums" inputmode="numeric" /></label>
        </div>
        <div>
          <span class="gl-label">{{ __('Zabezpečení') }}</span>
          <div class="gl-segf" role="group"><button v-for="o in SEC" :key="o" type="button" :aria-pressed="f.imap_security === o" @click="f.imap_security = o">{{ o }}</button></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <label><span class="gl-label">{{ __('Uživatel') }}</span><input v-model="f.imap_user" class="gl-field w-full" :placeholder="f.smtp_user" autocomplete="off" /></label>
          <label><span class="gl-label">{{ __('Heslo aplikace') }}</span><input v-model="f.imap_password" class="gl-field w-full" type="password" autocomplete="new-password" :placeholder="__('stejné jako u odchozí pošty')" /></label>
        </div>
        <p class="text-[13px] text-ink-gray-5">{{ __('Odpovědi čteme každých 15 minut. Čteme jen zprávy od kontaktů v kampaních a odpovědi na vaše e-maily, ostatní pošta zůstane nedotčená.') }}</p>
      </div>

      <div v-else class="flex flex-col gap-3.5">
        <div class="grid grid-cols-2 gap-3">
          <label><span class="gl-label">{{ __('Jméno odesílatele') }}</span><input v-model="f.from_name" class="gl-field w-full" /></label>
          <label><span class="gl-label">{{ __('E-mail odesílatele') }}</span><input v-model="f.from_email" class="gl-field w-full" :placeholder="f.smtp_user" /></label>
        </div>
        <label><span class="gl-label">{{ __('Podpis') }}</span><textarea v-model="f.signature" class="gl-field gl-text w-full" rows="3" :placeholder="'Ivan Dančenko\nGrowUpMedia · +420 …'" /></label>
        <label><span class="gl-label">{{ __('Adresa sídla (do patičky)') }}</span><input v-model="f.postal_address" class="gl-field w-full" :placeholder="__('Ulice 1, 110 00 Praha')" /></label>
        <label class="max-w-[180px]"><span class="gl-label">{{ __('Limit e-mailů týdně') }}</span><input v-model="f.weekly_limit" class="gl-field w-full tabular-nums" inputmode="numeric" /></label>
        <p class="text-[13px] text-ink-gray-5">{{ __('Patička s odkazem na odhlášení a adresou sídla se přidává do každého e-mailu automaticky a nejde vypnout.') }}</p>
      </div>
      <ErrorMessage class="mt-2" :message="error" />
    </template>
    <template #actions>
      <div class="flex items-center justify-between gap-2">
        <span class="text-[13px] text-ink-gray-5">{{ __('Krok {0} ze 3', [step + 1]) }}</span>
        <div class="flex gap-2">
          <Button v-if="data?.enabled && step === 0" variant="subtle" theme="red" :label="__('Odpojit')" @click="disconnect" />
          <Button :label="step ? __('Zpět') : __('Zrušit')" @click="step ? step-- : (show = false)" />
          <Button variant="solid" :loading="saving" :label="step === 2 ? __('Hotovo') : __('Pokračovat')" @click="next" />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { api } from '@/composables/outreach'
import { Button, Dialog, ErrorMessage, createResource, toast } from 'frappe-ui'
import { reactive, ref, watch } from 'vue'

const emit = defineEmits(['changed'])
const show = defineModel({ type: Boolean })
const STEPS = [__('Odchozí pošta'), __('Příchozí pošta'), __('Podpis')]
const SEC = ['STARTTLS', 'SSL/TLS', 'Žádné']
const step = ref(0)
const saving = ref(false)
const testing = ref(false)
const error = ref('')
const result = ref(null)
const f = reactive({ smtp_port: 587, imap_port: 993, smtp_security: 'STARTTLS', imap_security: 'SSL/TLS', weekly_limit: 20 })
const res = createResource({ url: 'growupcrm.outreach.get_mailbox', auto: true })
const data = ref(null)
watch(() => res.data, (d) => {
  if (!d) return
  data.value = d
  Object.assign(f, d, { smtp_password: '', imap_password: '' })
}, { immediate: true })

const payload = () => ({ ...f })
async function save() {
  data.value = await api('save_mailbox', { data: JSON.stringify(payload()) })
}
async function test() {
  testing.value = true
  error.value = ''
  try {
    await save()
    result.value = await api('test_mailbox')
    if (result.value.ok) emit('changed')
  } catch (e) {
    result.value = { ok: false, message: e.messages?.[0] || e.message }
  } finally {
    testing.value = false
  }
}
async function next() {
  error.value = ''
  saving.value = true
  try {
    await save()
    if (step.value < 2) return void step.value++
    emit('changed')
    toast.success(data.value.enabled ? __('Schránka je připojená') : __('Nastavení uloženo. Schránku ještě otestujte.'))
    show.value = false
  } catch (e) {
    error.value = e.messages?.[0] || e.message
  } finally {
    saving.value = false
  }
}
async function disconnect() {
  await api('disconnect_mailbox')
  emit('changed')
  show.value = false
}
</script>
