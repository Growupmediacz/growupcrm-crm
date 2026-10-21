<template>
  <LayoutHeader v-if="organization.doc">
    <template #left-header>
      <router-link v-if="isMobileView" :to="{ name: 'Organizations' }" class="text-[17px] font-bold text-ink-gray-9">‹ {{ __('Firmy') }}</router-link>
      <Breadcrumbs class="gl-crumbs" v-else :items="breadcrumbs" />
    </template>
    <template #right-header>
      <!-- GrowUp: přidává se v sekci (Aktivita → typ, Zakázky, Kontakty, Pobočky), horní „Nová zakázka“ není -->
      <Button v-if="isMobileView && headerAdd" variant="solid" icon="plus" :aria-label="headerAdd.label" @click="headerAdd.onClick" />
      <template v-else>
      <Button
        v-if="organization.doc.ico"
        :label="__('Načíst z ARES')"
        iconLeft="lucide-refresh-cw"
        :loading="aresLoading"
        @click="refreshFromAres"
      />
      <!-- design 3. kolo (05): Načíst z ARES · Naplánovat -->
      <Button :label="__('Naplánovat')" iconLeft="lucide-calendar" @click="showEvent = true" />
      </template>
    </template>
  </LayoutHeader>
  <div v-if="organization.doc" ref="parentRef" class="flex h-full gap-3 px-2 pb-2">
    <Resizer v-if="!isMobileView" :parent="$refs.parentRef" class="gl-card flex h-full flex-col overflow-hidden">
      <div class="p-5">
        <div class="flex items-center gap-4">
          <!-- design 3. kolo (05): logo jako zaoblený čtverec, název 28 px, stav a IČO pod ním -->
          <img v-if="organization.doc.organization_logo" :src="organization.doc.organization_logo" class="size-16 shrink-0 rounded-[18px] bg-white object-contain" alt="" />
          <div v-else class="flex size-16 shrink-0 items-center justify-center rounded-[18px] bg-[var(--accent-soft)] text-[20px] font-bold text-[var(--accent-700)]">{{ orgInitials }}</div>
          <div class="flex min-w-0 flex-col gap-1.5">
            <div class="truncate text-[26px] font-bold leading-tight tracking-[-0.02em] text-ink-gray-9">{{ organization.doc.organization_name }}</div>
            <div class="flex min-w-0 items-center gap-2 text-[14px] text-ink-gray-5">
              <span v-if="organization.doc.relationship" class="flex shrink-0 items-center gap-1.5 rounded-full bg-[rgba(110,120,200,.08)] px-2.5 py-0.5 text-[13px] font-semibold text-ink-gray-8">
                <span class="size-2 rounded-full" :style="{ background: REL_COLORS[organization.doc.relationship] || '#9ca3af' }" />{{ __(organization.doc.relationship) }}
              </span>
              <span v-if="organization.doc.ico" class="truncate">{{ __('IČO') }} {{ organization.doc.ico }}</span>
            </div>
          </div>
        </div>
        <!-- souhrn -->
        <div v-if="summary" class="mt-4 grid grid-cols-2 gap-2">
          <div v-for="s in stats" :key="s.label" class="rounded-[16px] px-4 py-3" :class="s.bg">
            <GlIcon :name="s.icon" :size="20" :class="s.fg" />
            <div class="num mt-1 text-[24px] font-bold leading-tight text-ink-gray-9">{{ s.value }}</div>
            <div class="text-[13px] text-ink-gray-5">{{ s.label }}</div>
          </div>
        </div>
        <div v-if="summary?.last_call" class="mt-3 flex items-center gap-3 rounded-[16px] bg-[rgba(224,161,0,.14)] px-4 py-3 text-[#7a4400]">
          <span class="lucide-phone size-5 shrink-0" aria-hidden="true" />
          <span class="min-w-0 flex-1">
            <span class="block truncate text-[14px] font-semibold">{{ __('Poslední hovor') }}: {{ summary.last_call.title }}</span>
            <span class="block truncate text-[12.5px] opacity-80">{{ dateTime(summary.last_call.date) }}<template v-if="summary.last_call.user_name"> · {{ summary.last_call.user_name }}</template></span>
          </span>
          <Button variant="solid" size="sm" :label="__('Zavolat')" @click="showCall = true" />
        </div>
      </div>
      <!-- GrowUp (oprava 13): Údaje o firmě jen ke čtení; celý formulář CRM až pod „Všechna pole“ -->
      <!-- P3: stav vztahu klienta -->
      <div v-if="showClient && client.data && !allFields" class="px-5 pb-1">
        <div class="mb-1.5 text-[13px] font-semibold text-[#3D4466]">{{ __('Stav vztahu') }}</div>
        <div class="gl-seg flex w-full">
          <button v-for="h in HEALTH" :key="h.key" class="gl-seg-btn flex-1 justify-center !px-2 text-[13px]" :class="client.data.health === h.key && 'gl-seg-on'" @click="setHealth(h.key)">
            <span class="size-2 rounded-full" :style="{ background: h.color }" />{{ h.label }}
          </button>
        </div>
      </div>
      <div v-if="!allFields" class="flex-1 overflow-y-auto px-3 pb-3">
        <GlOrgInfoCard :doc="organization.doc" :branches="branches" @saved="reload" @allFields="allFields = true" />
        <GlOrgWebCard :organization="organizationId" @updated="reload" />
      </div>
      <div v-else-if="sections.data" class="flex flex-1 flex-col justify-between overflow-hidden">
        <button class="mx-5 mb-2 self-start text-[13px] font-semibold text-[var(--accent-600)] hover:underline" @click="allFields = false">
          ‹ {{ __('Zpět na přehled') }}
        </button>
        <SidePanelLayout
          :sections="sections.data"
          doctype="CRM Organization"
          :docname="organization.doc.name"
          @reload="sections.reload"
          @beforeFieldChange="beforeFieldChange"
        />
      </div>
    </Resizer>

    <div class="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
    <!-- design 3. kolo (05): záložky jako samostatný pruh nad obsahem -->
    <div v-if="!isMobileView" class="gl-card flex shrink-0 gap-2 overflow-x-auto p-2">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="flex h-12 shrink-0 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition"
        :class="tab === t.key ? 'bg-[var(--accent-600)] text-white shadow-[0_8px_18px_-8px_color-mix(in_srgb,var(--accent-600)_70%,transparent)]' : 'bg-white/60 text-ink-gray-7 hover:bg-white'"
        @click="tab = t.key"
      >
        {{ t.label }}
        <span v-if="t.count !== null" class="num rounded-full px-2 py-0.5 text-[12px] font-bold" :class="tab === t.key ? 'bg-white/25 text-white' : 'bg-[rgba(110,120,200,.12)] text-ink-gray-6'">{{ t.count }}</span>
      </button>
    </div>
    <div class="gl-card flex flex-1 flex-col overflow-hidden">
      <!-- mobil (design „Mobil – Detail firmy“): logo, stav, rychlé akce a čísla -->
      <div v-if="isMobileView" class="flex flex-col items-center px-4 pt-5 text-center">
        <Avatar size="3xl" class="h-16 w-16" :label="organization.doc.organization_name" :image="organization.doc.organization_logo" />
        <div class="mt-3 text-[24px] font-bold leading-tight tracking-tight text-ink-gray-9">{{ organization.doc.organization_name }}</div>
        <div class="mt-1 flex items-center gap-2 text-[13px] text-ink-gray-6">
          <span v-if="organization.doc.relationship" class="flex items-center gap-1.5 font-bold text-ink-gray-9">
            <span class="size-2 rounded-full" :style="{ background: REL_COLORS[organization.doc.relationship] || '#9ca3af' }" />
            {{ __(organization.doc.relationship) }}
          </span>
          <span v-if="organization.doc.ico">{{ __('IČO') }} {{ organization.doc.ico }}</span>
        </div>
        <div class="mt-4 grid w-full grid-cols-4 gap-2">
          <a
            v-for="a in mobileActions"
            :key="a.label"
            :href="a.href"
            :target="a.external ? '_blank' : undefined"
            class="gl-round flex flex-col items-center gap-1 rounded-2xl py-2.5 text-[12px] font-bold"
            :class="a.disabled && 'pointer-events-none opacity-40'"
            @click="a.onClick && ($event.preventDefault(), a.onClick())"
          >
            <GlIcon :name="a.icon" :size="19" class="text-[var(--accent-600)]" />{{ a.label }}
          </a>
        </div>
        <div v-if="summary" class="mt-2 grid w-full grid-cols-4 gap-2">
          <div v-for="st in stats" :key="st.label" class="rounded-2xl bg-white/60 py-2">
            <div class="text-[20px] font-bold text-ink-gray-9">{{ st.value }}</div>
            <div class="text-[11px] text-ink-gray-5">{{ st.label }}</div>
          </div>
        </div>
      </div>
      <div v-if="isMobileView" class="m-4 mb-0 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-[rgba(110,120,200,.11)] p-[3px]">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="flex h-8 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-ink-gray-5 transition hover:text-ink-gray-9"
          :class="{ '!bg-white !text-ink-gray-9 shadow-[0_2px_10px_-2px_rgba(64,72,160,.28)]': tab === t.key }"
          @click="tab = t.key"
        >
          {{ t.label }}
          <Badge v-if="t.count !== null" variant="subtle" theme="gray" size="sm">{{ t.count }}</Badge>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-5">
        <!-- Aktivita -->
        <div v-if="tab === 'activity'">
          <!-- design 3. kolo (05): nadpis, filtry a Přidat, skupiny Nadcházející a po dnech, zakázka vpravo -->
          <h2 v-if="!isMobileView" class="mb-4 text-[28px] font-bold tracking-[-0.02em] text-ink-gray-9">{{ __('Aktivita') }}</h2>
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <button
              v-for="f in kindFilters"
              :key="f.key"
              class="h-10 rounded-full px-4 text-[15px] font-medium transition"
              :class="kind === f.key ? 'bg-[var(--accent-600)] text-white' : 'bg-white/60 text-ink-gray-7 ring-1 ring-[var(--line)] hover:bg-white'"
              @click="kind = f.key"
            >
              {{ f.label }}
            </button>
            <div v-if="!isMobileView" class="ml-auto">
              <Dropdown v-if="kind === 'all'" :options="addOptions" placement="right">
                <Button iconLeft="plus" :label="__('Přidat')" />
              </Dropdown>
              <Button v-else-if="addByKind[kind]" iconLeft="plus" :label="addByKind[kind].label" @click="addByKind[kind].onClick" />
            </div>
          </div>
          <GlEmptyState v-if="!timeline.length" class="my-8" icon="clock" :title="__('Zatím žádná aktivita')" :text="__('Zápisy, hovory, schůzky a úkoly u zakázek této firmy se zobrazí tady.')" />
          <template v-for="g in timelineGroups" :key="g.label">
            <div class="mt-3 border-b border-[var(--line)] pb-2 text-[16px] font-bold text-ink-gray-9">{{ g.label }}</div>
            <div
              v-for="item in g.items"
              :key="item.kind + item.id"
              class="flex items-start gap-4 border-b border-[var(--line)] px-1 py-3.5 last:border-b-0"
              :class="EDITABLE[item.kind] && 'cursor-pointer transition hover:bg-white/50'"
              :title="EDITABLE[item.kind] ? __('Upravit') : ''"
              @click="EDITABLE[item.kind] && editItem(item)"
            >
              <div class="flex size-12 shrink-0 items-center justify-center rounded-[14px]" :class="kindTone[item.kind]">
                <span :class="kindIcon[item.kind]" class="size-5" aria-hidden="true" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <router-link
                    v-if="item.kind === 'email' && item.lead"
                    :to="{ name: 'Lead', params: { leadId: item.lead }, hash: '#emails' }"
                    class="text-[16px] font-semibold text-ink-gray-9 hover:underline"
                    @click.stop
                  >{{ rowTitle(item) }}</router-link>
                  <span v-else class="text-[16px] font-semibold text-ink-gray-9">{{ rowTitle(item) }}</span>
                  <span v-if="rowBadge(item)" class="rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold" :class="rowBadge(item).cls">{{ rowBadge(item).text }}</span>
                </div>
                <div v-if="item.text" class="mt-1 line-clamp-2 whitespace-pre-line text-[14px] text-ink-gray-7">{{ plain(item.text) }}</div>
                <div class="mt-1 text-[13.5px] text-ink-gray-5">
                  {{ [g.upcoming ? dateTime(item.date) : timeOnly(item.date), item.user_name].filter(Boolean).join(' · ') }}
                </div>
              </div>
              <router-link
                v-if="item.lead && !isMobileView"
                :to="{ name: 'Lead', params: { leadId: item.lead } }"
                class="max-w-[220px] shrink-0 truncate rounded-full bg-[rgba(110,120,200,.1)] px-3 py-1 text-[13px] font-medium text-ink-gray-7 hover:bg-[rgba(110,120,200,.18)]"
                @click.stop
              >{{ item.lead_title }}</router-link>
            </div>
          </template>
        </div>

        <!-- Spolupráce (klient agentury): retainer, služby, projekty -->
        <GlClientBlocks v-else-if="tab === 'client'" :data="client.data" />

        <!-- Dokumenty (smlouvy, nabídky, ceníky, přílohy e-mailů) -->
        <GlOrgDocuments v-else-if="tab === 'documents'" ref="documentsRef" :organization="props.organizationId" />

        <!-- Zakázky -->
        <div v-else-if="tab === 'leads'">
          <div class="mb-3 flex justify-end">
            <Button :label="__('Nová zakázka')" iconLeft="plus" @click="showLeadModal = true" />
          </div>
          <GlEmptyState v-if="!leads.length" class="my-6" icon="brief" :title="__('Zatím žádná zakázka')" :text="__('Firma zatím nemá žádnou zakázku.')" :action="__('Nová zakázka')" primary @action="showLeadModal = true" />
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
                <td class="py-2 pr-3">{{ l.branch_name }}</td>
                <td class="py-2 pr-3">{{ l.owner_name }}</td>
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
                <td class="py-2 pr-3">{{ c.contact_type ? __(c.contact_type) : '' }}</td>
                <td class="py-2 pr-3">{{ c.designation }}</td>
                <td class="py-2 pr-3">{{ c.branch_name }}</td>
                <td class="py-2 pr-3">{{ c.email_id }}</td>
                <td class="py-2">{{ c.mobile_no }}</td>
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
                <td class="py-2 pr-3">{{ b.territory }}</td>
                <td class="py-2 pr-3">{{ b.city }}</td>
                <td class="py-2 pr-3">{{ b.responsible_name }}</td>
                <td class="py-2 pr-3">{{ b.leads }}</td>
                <td class="py-2 text-right"><Button variant="ghost" :label="__('Upravit')" @click="editBranch(b)" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </div>
  </div>
  <ErrorPage v-else-if="errorTitle" :errorTitle="errorTitle" :errorMessage="errorMessage" />

  <CalendarEventModal
    v-if="showEvent"
    v-model="showEvent"
    :lead="defaultLead || null"
    :organization="organization.doc?.name"
    :subject="__('Schůzka: {0}', [organization.doc?.organization_name])"
    :start="tomorrowTen"
    :currentUser="sessionUser"
    :users="calendarUsers.data || []"
    @saved="overview.reload()"
  />
  <LeadModal v-if="showLeadModal" v-model="showLeadModal" :defaults="leadDefaults" />
  <GlOrgActivityModal
    v-if="activityKind"
    :key="activityKind"
    :modelValue="true"
    :kind="activityKind"
    :organization="organization.doc?.name"
    :organizationName="organization.doc?.organization_name"
    :leads="leads"
    :defaultLead="defaultLead"
    @update:modelValue="(v) => !v && (activityKind = '')"
    @saved="overview.reload()"
  />
  <GlCallModal
    v-if="showCall"
    v-model="showCall"
    :organization="organization.doc?.name"
    :organizationName="organization.doc?.organization_name"
    :leads="leads"
    :defaultLead="defaultLead"
    @saved="overview.reload()"
  />
  <GlTaskModal v-if="editTask" :modelValue="true" :task="editTask" @update:modelValue="(v) => !v && (editTask = '')" @saved="overview.reload()" />
  <BranchDialog v-model="showBranchDialog" :organization="props.organizationId" :branch="activeBranch" @saved="reload" />
  <ContactDialog v-model="showContactDialog" :organization="props.organizationId" :branches="branches" @saved="reload" />
</template>

<script setup>
import GlEmptyState from '@/components/GlEmptyState.vue'
import ErrorPage from '@/components/ErrorPage.vue'
import Resizer from '@/components/Resizer.vue'
import SidePanelLayout from '@/components/SidePanelLayout.vue'
import LayoutHeader from '@/components/LayoutHeader.vue'
import LeadModal from '@/components/Modals/GlNewLeadModal.vue'
import CalendarEventModal from '@/components/Modals/CalendarEventModal.vue'
import GlCallModal from '@/components/Modals/GlCallModal.vue'
import GlTaskModal from '@/components/Modals/GlTaskModal.vue'
import GlOrgActivityModal from '@/components/Firma/GlOrgActivityModal.vue'
import GlOrgDocuments from '@/components/Firma/GlOrgDocuments.vue'
import GlIcon from '@/components/GlIcon.vue'
import GlOrgInfoCard from '@/components/Firma/GlOrgInfoCard.vue'
import GlOrgWebCard from '@/components/Firma/GlOrgWebCard.vue'
import GlClientBlocks from '@/components/Firma/GlClientBlocks.vue'
import { agencyEnabled } from '@/composables/agency'
import { sessionStore } from '@/stores/session'
import BranchDialog from '@/components/Firma/BranchDialog.vue'
import ContactDialog from '@/components/Firma/ContactDialog.vue'
import { useDocument } from '@/data/document'
import { useDoctypeModal } from '@/composables/doctypeModal'
import { getSettings } from '@/stores/settings'
import { statusesStore } from '@/stores/statuses'
import { isMobileView } from '@/composables/settings'
import { htmlToText } from '@/utils'
import { Avatar, Badge, Breadcrumbs, Button, Dropdown, call, createResource, toast, usePageMeta } from 'frappe-ui'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
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
const allFields = ref(false)

// P3: firma ve stavu Klient (jen agenturní moduly): spolupráce, projekty, stav vztahu
const showClient = computed(() => agencyEnabled.value && organization.doc?.relationship === 'Klient')
const client = createResource({ url: 'growupcrm.clients.get_client', params: { organization: props.organizationId } })
watch(showClient, (on) => on && client.fetch(), { immediate: true })
const HEALTH = [
  { key: 'V pořádku', label: __('V pořádku'), color: '#22b35e' },
  { key: 'Potřebuje pozornost', label: __('Pozornost'), color: '#e0a100' },
  { key: 'Ohrožený', label: __('Ohrožený'), color: '#a82614' },
]
async function setHealth(health) {
  await call('growupcrm.clients.set_health', { organization: props.organizationId, health })
  client.reload()
}

// mobil: rychlé akce přes první kontakt firmy s telefonem / e-mailem
const REL_COLORS = { Klient: '#22b35e', Prospekt: '#3b82f6', 'Bývalý klient': '#9ca3af' }
const showEvent = ref(false)
const sessionUser = sessionStore().user
const calendarUsers = createResource({ url: 'growupcrm.calendar.get_users', auto: true })
const tomorrowTen = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  return d
})
const mobileActions = computed(() => {
  const list = overview.data?.contacts || []
  const phone = list.find((x) => x.mobile_no)?.mobile_no
  const email = list.find((x) => x.email_id)?.email_id
  const web = organization.doc?.website
  return [
    { label: __('Zavolat'), icon: 'phone', href: phone ? `tel:${phone}` : undefined, disabled: !phone },
    { label: __('E-mail'), icon: 'mail', href: email ? `mailto:${email}` : undefined, disabled: !email },
    { label: __('Schůzka'), icon: 'cal', onClick: () => (showEvent.value = true) },
    { label: __('Web'), icon: 'globe', href: web || undefined, external: true, disabled: !web },
  ]
})
const leads = computed(() => overview.data?.leads || [])
const contacts = computed(() => overview.data?.contacts || [])
const branches = computed(() => overview.data?.branches || [])

const tab = ref('activity')
// počet dokumentů pro záložku (seznam si načítá GlOrgDocuments sám)
const documentsRef = ref(null)
const documents = createResource({ url: 'growupcrm.documents.get_documents', params: { organization: props.organizationId }, auto: true })
watch(() => documentsRef.value?.docs?.data, (d) => d && (documents.data = d))
// pořadí podle návrhu 05; klient agentury má navíc Spolupráci (retainer, projekty)
const tabs = computed(() => [
  { key: 'activity', label: __('Aktivita'), count: overview.data?.timeline?.length ?? 0 },
  { key: 'leads', label: __('Zakázky'), count: leads.value.length },
  { key: 'contacts', label: __('Kontakty'), count: contacts.value.length },
  { key: 'branches', label: __('Pobočky'), count: branches.value.length },
  { key: 'documents', label: __('Dokumenty'), count: documents.data?.documents?.length ?? 0 },
  ...(showClient.value ? [{ key: 'client', label: __('Spolupráce'), count: null }] : []),
])
// design 3. kolo (05): dlaždice s ikonou, hovory oranžově
const stats = computed(() => [
  { label: __('Zakázky'), value: summary.value.leads, icon: 'doc', fg: 'text-[var(--accent-600)]', bg: 'bg-[rgba(110,120,200,.075)]' },
  { label: __('Schůzky'), value: summary.value.meetings, icon: 'cal', fg: 'text-[#3b6ef6]', bg: 'bg-[rgba(110,120,200,.075)]' },
  { label: __('Zápisy'), value: summary.value.notes, icon: 'doc', fg: 'text-[#8b5cf6]', bg: 'bg-[rgba(110,120,200,.075)]' },
  { label: __('Hovory'), value: summary.value.calls, icon: 'phone', fg: 'text-[#f97316]', bg: 'bg-[rgba(249,115,22,.08)]' },
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
const kindTone = {
  event: 'bg-[rgba(59,110,246,.13)] text-[#1f48b8]',
  note: 'bg-[rgba(139,92,246,.14)] text-[#5a2fc0]',
  call: 'bg-[rgba(249,115,22,.14)] text-[#a3360a]',
  task: 'bg-[rgba(234,170,8,.18)] text-[#7a4400]',
  comment: 'bg-[rgba(100,110,150,.12)] text-[#4a5173]',
  email: 'bg-[rgba(20,160,190,.13)] text-[#08626f]',
}
const kindIcon = {
  event: 'lucide-calendar', note: 'lucide-notebook-pen', call: 'lucide-phone', task: 'lucide-check-square',
  comment: 'lucide-message-square', email: 'lucide-mail',
}
// GrowUp: přidání aktivity přímo z Firmy, v sekci podle typu (schůzka → kalendář, ostatní → Zakázka nebo firma)
const showCall = ref(false)
const orgInitials = computed(() =>
  (organization.doc?.organization_name || '?')
    .replace(/\b(s\.r\.o\.|a\.s\.|spol\.)/gi, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)
const activityKind = ref('')
const openLeads = computed(() => {
  const closed = new Set((leadStatuses.data || []).filter((st) => ['Won', 'Lost'].includes(st.type)).map((st) => st.name))
  return leads.value.filter((l) => !closed.has(l.status))
})
// jediná otevřená Zakázka firmy se předvybere, jinak „jen k firmě“
const defaultLead = computed(() => (openLeads.value.length === 1 ? openLeads.value[0].name : ''))
const addByKind = computed(() => ({
  event: { label: __('Nová schůzka'), onClick: () => (showEvent.value = true) },
  note: { label: __('Nový zápis'), onClick: () => (activityKind.value = 'note') },
  call: { label: __('Zapsat hovor'), onClick: () => (showCall.value = true) },
  task: { label: __('Nový úkol'), onClick: () => (activityKind.value = 'task') },
  comment: { label: __('Nový komentář'), onClick: () => (activityKind.value = 'comment') },
}))
const addOptions = computed(() =>
  ['event', 'note', 'call', 'task', 'comment'].map((k) => ({ label: addByKind.value[k].label, onClick: addByKind.value[k].onClick })),
)
// mobil: tlačítko + v hlavičce dělá to, co je v aktuální sekci
const headerAdd = computed(() => {
  if (tab.value === 'activity') return addByKind.value[kind.value] || addByKind.value.note
  if (tab.value === 'leads') return { label: __('Nová zakázka'), onClick: () => (showLeadModal.value = true) }
  if (tab.value === 'documents') return null
  if (tab.value === 'contacts') return { label: __('Přidat kontakt'), onClick: () => (showContactDialog.value = true) }
  if (tab.value === 'branches') return { label: __('Přidat pobočku'), onClick: () => editBranch(null) }
  return null
})
// zápis a úkol z aktivity firmy jdou upravit (stejný dialog jako v zakázce a v Zápisech / Úkolech)
const EDITABLE = { note: { doctype: 'FCRM Note', title: 'Note' }, task: { doctype: 'CRM Task', title: 'Task' } }
const { showModal } = useDoctypeModal()
const editTask = ref('')
function editItem(item) {
  if (item.kind === 'task') return (editTask.value = item.id)
  const e = EDITABLE[item.kind]
  showModal({ name: item.id, doctype: e.doctype, title: e.title, callbacks: { afterUpdate: () => overview.reload() } })
}
const timeline = computed(() =>
  (overview.data?.timeline || []).filter((t) => kind.value === 'all' || t.kind === kind.value),
)
const toDate = (d) => new Date(String(d).replace(' ', 'T'))
const dayFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long' })
const timeFmt = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' })
const timeOnly = (d) => (d ? timeFmt.format(toDate(d)) : '')
// design 3. kolo (05): nejdřív Nadcházející (schůzky a úkoly v budoucnu), pak po dnech od nejnovějšího
const timelineGroups = computed(() => {
  const now = new Date()
  const startOf = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const today = startOf(now)
  const upcoming = timeline.value.filter((t) => t.date && toDate(t.date) > now && ['event', 'task'].includes(t.kind))
  const groups = upcoming.length
    ? [{ label: __('Nadcházející'), upcoming: true, items: [...upcoming].sort((a, b) => toDate(a.date) - toDate(b.date)) }]
    : []
  for (const t of timeline.value) {
    if (upcoming.includes(t)) continue
    const d = t.date ? toDate(t.date) : null
    const diff = d ? Math.round((today - startOf(d)) / 86400000) : null
    const label = d === null ? __('Bez data') : diff === 0 ? __('Dnes') : diff === 1 ? __('Včera') : dayFmt.format(d)
    let g = groups.find((x) => x.label === label && !x.upcoming)
    if (!g) groups.push((g = { label, items: [] }))
    g.items.push(t)
  }
  return groups
})
function rowTitle(item) {
  if (item.kind === 'call') return kindLabel.value.call
  if (item.kind === 'event' || item.kind === 'task' || item.kind === 'email') return item.title || kindLabel.value[item.kind]
  return item.title || kindLabel.value[item.kind]
}
const BADGE = {
  plan: 'bg-[color-mix(in_srgb,var(--accent-600)_12%,transparent)] text-[var(--accent-700)]',
  warn: 'bg-[rgba(224,161,0,.16)] text-[#7a4400]',
  ok: 'bg-[rgba(34,179,94,.13)] text-[#178a4a]',
  gray: 'bg-[rgba(110,120,200,.1)] text-ink-gray-6',
}
function rowBadge(item) {
  if (item.kind === 'event' && item.date && toDate(item.date) > new Date()) return { text: __('Naplánováno'), cls: BADGE.plan }
  if (item.kind === 'call' && item.title) return { text: item.title, cls: /nebral|zpět/i.test(item.title) ? BADGE.warn : BADGE.ok }
  if (item.kind === 'task' && item.status) return { text: __(item.status), cls: item.status === 'Done' ? BADGE.ok : BADGE.gray }
  if (item.kind === 'email') return { text: item.direction === 'Received' ? __('Přijatý') : __('Odeslaný'), cls: item.direction === 'Received' ? BADGE.ok : BADGE.plan }
  return null
}

const dateFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dateTime = (d) => (d ? dateFmt.format(new Date(String(d).replace(' ', 'T'))) : '')
const money = (v) => (v ? new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(v) : '')
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
