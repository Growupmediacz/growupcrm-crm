<template>
  <LayoutHeader v-if="organization.doc">
    <template #left-header>
      <Breadcrumbs :items="breadcrumbs" />
    </template>
    <template #right-header>
      <Button
        v-if="organization.doc.ico"
        :label="__('Načíst z ARES')"
        iconLeft="lucide-refresh-cw"
        :loading="aresLoading"
        @click="refreshFromAres"
      />
      <Button variant="solid" :label="__('Nová zakázka')" iconLeft="plus" @click="showLeadModal = true" />
    </template>
  </LayoutHeader>
  <div v-if="organization.doc" ref="parentRef" class="flex h-full">
    <Resizer v-if="!isMobileView" :parent="$refs.parentRef" class="flex h-full flex-col overflow-hidden border-r">
      <div class="border-b p-5">
        <div class="flex items-center gap-4">
          <Avatar size="3xl" class="h-15.5 w-15.5" :label="organization.doc.organization_name" :image="organization.doc.organization_logo" />
          <div class="flex min-w-0 flex-col gap-1.5">
            <div class="truncate text-2xl-medium text-ink-gray-9">{{ organization.doc.organization_name }}</div>
            <div class="truncate text-sm text-ink-gray-6">
              <span v-if="organization.doc.ico">{{ __('IČO') }} {{ organization.doc.ico }}</span>
              <span v-if="organization.doc.ico && organization.doc.territory"> · </span>
              <span v-if="organization.doc.territory">{{ organization.doc.territory }}</span>
            </div>
          </div>
        </div>
        <!-- souhrn -->
        <div v-if="summary" class="mt-4 grid grid-cols-2 gap-2">
          <div v-for="s in stats" :key="s.label" class="rounded border border-outline-gray-2 px-3 py-2">
            <div class="text-xl-medium text-ink-gray-9">{{ s.value }}</div>
            <div class="text-xs text-ink-gray-5">{{ s.label }}</div>
          </div>
        </div>
        <div v-if="summary?.last_call" class="mt-3 flex items-start gap-2 rounded bg-surface-gray-2 px-3 py-2 text-sm text-ink-gray-7">
          <span class="lucide-phone mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            {{ __('Poslední hovor') }}: <b>{{ summary.last_call.title }}</b>
            ({{ dateTime(summary.last_call.date) }}<span v-if="summary.last_call.user_name">, {{ summary.last_call.user_name }}</span>)
          </span>
        </div>
      </div>
      <div v-if="sections.data" class="flex flex-1 flex-col justify-between overflow-hidden">
        <SidePanelLayout
          :sections="sections.data"
          doctype="CRM Organization"
          :docname="organization.doc.name"
          @reload="sections.reload"
          @beforeFieldChange="beforeFieldChange"
        />
      </div>
    </Resizer>

    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- mobil: bez levého panelu, jen název a souhrn -->
      <div v-if="isMobileView" class="border-b p-4">
        <div class="truncate text-xl-medium text-ink-gray-9">{{ organization.doc.organization_name }}</div>
        <div class="mt-0.5 text-sm text-ink-gray-6">
          <span v-if="organization.doc.ico">{{ __('IČO') }} {{ organization.doc.ico }}</span>
          <span v-if="organization.doc.territory"> · {{ organization.doc.territory }}</span>
        </div>
        <div v-if="summary" class="mt-2 flex flex-wrap gap-x-4 text-sm text-ink-gray-7">
          <span v-for="s in stats" :key="s.label">{{ s.label }}: <b>{{ s.value }}</b></span>
        </div>
      </div>
      <div class="flex min-h-[45px] items-center gap-7 overflow-x-auto border-b px-5">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="flex items-center gap-2 border-b border-transparent py-2.5 text-base text-ink-gray-5 duration-300 hover:text-ink-gray-9"
          :class="{ '!border-ink-gray-9 text-ink-gray-9': tab === t.key }"
          @click="tab = t.key"
        >
          {{ t.label }}
          <Badge variant="subtle" theme="gray" size="sm">{{ t.count }}</Badge>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <!-- Aktivita -->
        <div v-if="tab === 'activity'">
          <div class="mb-4 flex flex-wrap gap-1.5">
            <button
              v-for="f in kindFilters"
              :key="f.key"
              class="rounded-full border px-3 py-1 text-sm"
              :class="kind === f.key ? 'border-outline-gray-4 bg-surface-gray-3 text-ink-gray-9' : 'border-outline-gray-2 text-ink-gray-6 hover:bg-surface-gray-2'"
              @click="kind = f.key"
            >
              {{ f.label }}
            </button>
          </div>
          <div v-if="!timeline.length" class="py-16 text-center text-sm text-ink-gray-5">
            {{ __('Zatím tu není žádná aktivita. Zápisy, hovory, schůzky a úkoly u zakázek této firmy se zobrazí tady.') }}
          </div>
          <div v-for="item in timeline" :key="item.kind + item.id" class="mb-4 flex gap-3">
            <div class="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-gray-2 text-ink-gray-7">
              <span :class="kindIcon[item.kind]" class="size-4" aria-hidden="true" />
            </div>
            <div class="min-w-0 flex-1 border-b pb-4">
              <div class="flex flex-wrap items-baseline gap-x-2 text-sm">
                <span class="font-medium text-ink-gray-9">{{ kindLabel[item.kind] }}</span>
                <span v-if="item.title" class="text-ink-gray-8">{{ item.title }}</span>
                <span v-if="item.kind === 'task'" class="text-ink-gray-5">({{ __(item.status) }})</span>
              </div>
              <div v-if="item.text" class="mt-1 line-clamp-4 whitespace-pre-line text-sm text-ink-gray-7">{{ plain(item.text) }}</div>
              <div class="mt-1 flex flex-wrap gap-x-2 text-xs text-ink-gray-5">
                <span>{{ dateTime(item.date) }}</span>
                <span v-if="item.user_name">· {{ item.user_name }}</span>
                <router-link v-if="item.lead" :to="{ name: 'Lead', params: { leadId: item.lead } }" class="text-ink-blue-5 hover:underline">
                  · {{ item.lead_title }}
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Zakázky -->
        <div v-else-if="tab === 'leads'">
          <div class="mb-3 flex justify-end">
            <Button :label="__('Nová zakázka')" iconLeft="plus" @click="showLeadModal = true" />
          </div>
          <div v-if="!leads.length" class="py-16 text-center text-sm text-ink-gray-5">{{ __('Firma zatím nemá žádnou zakázku.') }}</div>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-xs text-ink-gray-5">
              <tr>
                <th class="py-2 pr-3 font-normal">{{ __('Zakázka') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Stav') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Hodnota') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Pobočka') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Obchodník') }}</th>
                <th class="py-2 font-normal">{{ __('Změněno') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="l in leads" :key="l.name" class="border-t">
                <td class="py-2 pr-3">
                  <router-link :to="{ name: 'Lead', params: { leadId: l.name } }" class="text-ink-blue-5 hover:underline">{{ l.order_title || l.lead_name || l.name }}</router-link>
                  <div v-if="l.order_title && l.lead_name" class="text-xs text-ink-gray-5">{{ l.lead_name }}</div>
                </td>
                <td class="py-2 pr-3">{{ __(l.status) }}</td>
                <td class="py-2 pr-3">{{ money(l.order_value) }}</td>
                <td class="py-2 pr-3">{{ l.branch_name || '–' }}</td>
                <td class="py-2 pr-3">{{ l.owner_name || '–' }}</td>
                <td class="py-2">{{ dateTime(l.modified) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Kontakty -->
        <div v-else-if="tab === 'contacts'">
          <div class="mb-3 flex justify-end">
            <Button :label="__('Přidat kontakt')" iconLeft="plus" @click="showContactDialog = true" />
          </div>
          <div v-if="!contacts.length" class="py-16 text-center text-sm text-ink-gray-5">
            {{ __('Zatím tu nejsou žádné kontakty. Přidejte třeba účetní nebo technika.') }}
          </div>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-xs text-ink-gray-5">
              <tr>
                <th class="py-2 pr-3 font-normal">{{ __('Jméno') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Typ') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Pozice') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Pobočka') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('E-mail') }}</th>
                <th class="py-2 font-normal">{{ __('Mobil') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in contacts" :key="c.name" class="border-t">
                <td class="py-2 pr-3">
                  <router-link :to="{ name: 'Contact', params: { contactId: c.name } }" class="text-ink-blue-5 hover:underline">{{ c.full_name || c.name }}</router-link>
                </td>
                <td class="py-2 pr-3">{{ c.contact_type ? __(c.contact_type) : '–' }}</td>
                <td class="py-2 pr-3">{{ c.designation || '–' }}</td>
                <td class="py-2 pr-3">{{ c.branch_name || '–' }}</td>
                <td class="py-2 pr-3">{{ c.email_id || '–' }}</td>
                <td class="py-2">{{ c.mobile_no || '–' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pobočky -->
        <div v-else-if="tab === 'branches'">
          <div class="mb-3 flex justify-end">
            <Button :label="__('Přidat pobočku')" iconLeft="plus" @click="editBranch(null)" />
          </div>
          <div v-if="!branches.length" class="py-16 text-center text-sm text-ink-gray-5">
            {{ __('Firma zatím nemá pobočky. Pobočka určuje kraj a odpovědného obchodníka zakázky.') }}
          </div>
          <table v-else class="w-full text-left text-sm">
            <thead class="text-xs text-ink-gray-5">
              <tr>
                <th class="py-2 pr-3 font-normal">{{ __('Pobočka') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Kraj') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Město') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Odpovědný obchodník') }}</th>
                <th class="py-2 pr-3 font-normal">{{ __('Zakázky') }}</th>
                <th class="py-2" />
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in branches" :key="b.name" class="border-t">
                <td class="py-2 pr-3 text-ink-gray-9">{{ b.branch_name }}</td>
                <td class="py-2 pr-3">{{ b.territory || '–' }}</td>
                <td class="py-2 pr-3">{{ b.city || '–' }}</td>
                <td class="py-2 pr-3">{{ b.responsible_name || '–' }}</td>
                <td class="py-2 pr-3">{{ b.leads }}</td>
                <td class="py-2 text-right"><Button variant="ghost" :label="__('Upravit')" @click="editBranch(b)" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  <ErrorPage v-else-if="errorTitle" :errorTitle="errorTitle" :errorMessage="errorMessage" />

  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
  <BranchDialog v-model="showBranchDialog" :organization="props.organizationId" :branch="activeBranch" @saved="reload" />
  <ContactDialog v-model="showContactDialog" :organization="props.organizationId" :branches="branches" @saved="reload" />
</template>

<script setup>
import ErrorPage from '@/components/ErrorPage.vue'
import Resizer from '@/components/Resizer.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import LeadModal from '@/components/Modals/LeadModal.vue'
import BranchDialog from '@/components/Firma/BranchDialog.vue'
import ContactDialog from '@/components/Firma/ContactDialog.vue'
import { useDocument } from '@/data/document'
import { getSettings } from '@/stores/settings'
import { statusesStore } from '@/stores/statuses'
import { isMobileView } from '@/composables/settings'
import { htmlToText } from '@/utils'
import { Avatar, Badge, Breadcrumbs, Button, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

// GrowUp: přehled firmy (Zakázky, kontakty, pobočky, aktivita). Data dodává growupcrm.firmy.get_overview.
const props = defineProps({ organizationId: { type: String, required: true } })

const { brand } = getSettings()
const { leadStatuses } = statusesStore()
const router = useRouter()

const errorTitle = ref('')
const errorMessage = ref('')
const { document: organization } = useDocument('CRM Organization', props.organizationId)

// Ikona firmy se stahuje z webu na pozadí: když ještě není, po chvíli dokument načteme znovu
let logoChecks = 0
const logoTimer = setInterval(() => {
  const d = organization.doc
  if (!d || d.organization_logo || !d.website || ++logoChecks > 4) return clearInterval(logoTimer)
  organization.reload?.()
}, 5000)
onBeforeUnmount(() => clearInterval(logoTimer))

const overview = createResource({
  url: 'growupcrm.firmy.get_overview',
  params: { organization: props.organizationId },
  auto: true,
  onError: (e) => {
    errorTitle.value = __('Firmu se nepodařilo načíst')
    errorMessage.value = e.messages?.[0] || ''
  },
})
function reload() {
  overview.reload()
  organization.reload?.()
}

const summary = computed(() => overview.data?.summary)
const leads = computed(() => overview.data?.leads || [])
const contacts = computed(() => overview.data?.contacts || [])
const branches = computed(() => overview.data?.branches || [])

const tab = ref('activity')
const tabs = computed(() => [
  { key: 'activity', label: __('Aktivita'), count: overview.data?.timeline?.length ?? 0 },
  { key: 'leads', label: __('Zakázky'), count: leads.value.length },
  { key: 'contacts', label: __('Kontakty'), count: contacts.value.length },
  { key: 'branches', label: __('Pobočky'), count: branches.value.length },
])
const stats = computed(() => [
  { label: __('Zakázky'), value: summary.value.leads },
  { label: __('Schůzky'), value: summary.value.meetings },
  { label: __('Zápisy'), value: summary.value.notes },
  { label: __('Hovory'), value: summary.value.calls },
])

const kind = ref('all')
const kindFilters = computed(() => [
  { key: 'all', label: __('Vše') },
  { key: 'event', label: __('Schůzky') },
  { key: 'note', label: __('Zápisy') },
  { key: 'call', label: __('Hovory') },
  { key: 'task', label: __('Úkoly') },
  { key: 'comment', label: __('Komentáře') },
  { key: 'email', label: __('E-maily') },
])
const kindLabel = computed(() => ({
  event: __('Schůzka'), note: __('Zápis'), call: __('Hovor'), task: __('Úkol'), comment: __('Komentář'), email: __('E-mail'),
}))
const kindIcon = {
  event: 'lucide-calendar', note: 'lucide-notebook-pen', call: 'lucide-phone', task: 'lucide-check-square',
  comment: 'lucide-message-square', email: 'lucide-mail',
}
const timeline = computed(() =>
  (overview.data?.timeline || []).filter((t) => kind.value === 'all' || t.kind === kind.value),
)

const dateFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dateTime = (d) => (d ? dateFmt.format(new Date(String(d).replace(' ', 'T'))) : '')
const money = (v) => (v ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v) : '–')
const plain = (html) => htmlToText(html || '')

// Nová zakázka z Firmy: firma a výchozí stav (první stav pipeline) jsou předvyplněné
const leadDefaults = computed(() => ({
  organization_link: organization.doc?.name,
  status: leadStatuses.data?.[0]?.name || 'Nová',
}))

// Větve a dialogy
const showLeadModal = ref(false)
const showContactDialog = ref(false)
const showBranchDialog = ref(false)
const activeBranch = ref(null)
function editBranch(b) {
  activeBranch.value = b
  showBranchDialog.value = true
}

// ARES
const aresLoading = ref(false)
async function refreshFromAres() {
  aresLoading.value = true
  try {
    await call('growupcrm.ares.refresh_organization', { name: props.organizationId })
    toast.success(__('Údaje byly načteny z ARES'))
    reload()
  } catch (e) {
    toast.error(e.messages?.[0] || e.message)
  } finally {
    aresLoading.value = false
  }
}

const breadcrumbs = computed(() => [
  { label: __('Organizations'), route: { name: 'Organizations' } },
  { label: organization.doc?.organization_name || props.organizationId, route: { name: 'Organization', params: { organizationId: props.organizationId } } },
])
usePageMeta(() => ({ title: organization.doc?.organization_name || props.organizationId, icon: brand.favicon }))

const sections = createResource({
  url: 'crm.fcrm.doctype.crm_fields_layout.crm_fields_layout.get_sidepanel_sections',
  cache: ['sidePanelSections', 'CRM Organization'],
  params: { doctype: 'CRM Organization' },
  auto: true,
})

function beforeFieldChange(data) {
  if (Object.hasOwn(data ?? {}, 'organization_name')) {
    call('frappe.client.rename_doc', {
      doctype: 'CRM Organization',
      old_name: props.organizationId,
      new_name: data.organization_name,
    }).then(() => router.push({ name: 'Organization', params: { organizationId: data.organization_name } }))
  } else {
    organization.save.submit(null, { onSuccess: reload })
  }
}
</script>
