<template>
  <!-- GrowUp (design 2. kolo, oprava 21, varianta A „Více“ ve spodní liště):
       sekce, které nejsou v liště, ve skupinách jako na desktopu; oznámení a profil vpravo nahoře. -->
  <div class="flex flex-col gap-2 px-5 pb-6 pt-6">
    <div class="mb-2 flex items-center justify-between">
      <h1 class="text-[32px] font-bold tracking-tight text-ink-gray-9">{{ __('Více') }}</h1>
      <div class="flex items-center gap-2">
        <router-link
          :to="{ name: 'Notifications' }"
          class="gl-round relative flex size-11 items-center justify-center rounded-full"
          :aria-label="__('Oznámení')"
        >
          <GlIcon name="bell" :size="19" />
          <span
            v-if="unreadNotificationsCount"
            class="absolute right-2.5 top-2.5 size-2.5 rounded-full border-2 border-white bg-[#e5484d]"
          />
        </router-link>
        <Dropdown :options="profileOptions" placement="right">
          <button
            class="flex size-11 items-center justify-center rounded-full bg-[#dde6ff] text-[13px] font-bold text-[#2e4bb8] shadow-[0_2px_10px_-3px_rgba(64,72,160,.35)]"
            :aria-label="__('Profil')"
          >
            {{ initials }}
          </button>
        </Dropdown>
      </div>
    </div>

    <template v-for="g in groups" :key="g.name">
      <div class="mt-2 px-1 text-[13px] font-semibold text-[var(--text-3,#5B6285)]">{{ g.name }}</div>
      <nav class="gl-card overflow-hidden !rounded-[22px]">
        <router-link
          v-for="(item, i) in g.items"
          :key="item.route"
          :to="{ name: item.route }"
          class="flex min-h-[53px] items-center gap-3.5 px-4 active:bg-white/60"
          :class="i && 'border-t border-[rgba(110,120,200,.12)]'"
        >
          <span class="flex size-9 items-center justify-center rounded-[11px] bg-[rgba(110,120,200,.12)] text-ink-gray-7">
            <GlIcon :name="item.icon" :size="18" />
          </span>
          <span class="flex-1 text-[17px] font-medium text-ink-gray-9">{{ item.label }}</span>
          <span
            v-if="item.count"
            class="num text-[15px] font-semibold"
            :class="item.hot ? 'text-[#C8321F]' : 'text-ink-gray-5'"
            >{{ item.count }}</span
          >
          <GlIcon name="right" :size="16" class="text-ink-gray-4" />
        </router-link>
      </nav>
    </template>
  </div>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { agencyEnabled, analyticsEnabled, outreachEnabled } from '@/composables/agency'
import { useLeadsOnlyMode, LEADS_ONLY_HIDDEN_ROUTES } from '@/composables/leadsOnlyMode'
import { unreadNotificationsCount } from '@/stores/notifications'
import { sessionStore } from '@/stores/session'
import { usersStore } from '@/stores/users'
import { showAboutModal } from '@/composables/modals'
import { createResource, Dropdown } from 'frappe-ui'
import { computed } from 'vue'

const leadsOnlyMode = useLeadsOnlyMode()
const { logout } = sessionStore()
const { getUser } = usersStore()
const user = computed(() => getUser() || {})
const initials = computed(() =>
  (user.value.full_name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)

const counts = createResource({
  url: 'growupcrm.today.get_nav_counts',
  cache: 'growupcrm-nav-counts',
  auto: true,
})

const groups = computed(() => {
  const visible = (route) => !(leadsOnlyMode.value && LEADS_ONLY_HIDDEN_ROUTES.includes(route))
  const out = [
    {
      name: __('Prodej'),
      items: [
        { label: __('Kontakty'), icon: 'users', route: 'ContactsCards' },
        outreachEnabled.value && { label: __('Outreach'), icon: 'send', route: 'Outreach', count: counts.data?.outreach },
      ].filter(Boolean),
    },
    {
      name: __('Práce'),
      items: [
        { label: __('Úkoly'), icon: 'check', route: 'Tasks', count: counts.data?.overdue_tasks, hot: true },
        { label: __('Zápisy'), icon: 'doc', route: 'Notes' },
        { label: __('Hovory'), icon: 'phone', route: 'Call Logs' },
      ],
    },
  ]
  if (agencyEnabled.value) {
    out.push({
      name: __('Dodání'),
      items: [
        { label: __('Klienti'), icon: 'star', route: 'Clients' },
        { label: __('Projekty'), icon: 'folder', route: 'Projects' },
        { label: __('Plány'), icon: 'target', route: 'Plans' },
        analyticsEnabled.value && { label: __('Analytika'), icon: 'chart', route: 'Analytics' },
      ].filter(Boolean),
    })
  }
  return out
    .map((g) => ({ ...g, items: g.items.filter((i) => visible(i.route)) }))
    .filter((g) => g.items.length)
})

const profileOptions = computed(() => [
  {
    group: user.value.full_name || '',
    items: [
      { icon: 'help-circle', label: __('Nápověda a podpora'), onClick: () => (showAboutModal.value = true) },
      { icon: 'log-out', label: __('Odhlásit se'), onClick: () => logout.submit() },
    ],
  },
])
</script>
