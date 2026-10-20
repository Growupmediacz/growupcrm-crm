<template>
  <!-- GrowUp: avatar uživatele – fotka z profilu (Nastavení → Profil), jinak iniciály. Velikost a barvy dává volající přes class. -->
  <span class="flex shrink-0 items-center justify-center overflow-hidden rounded-full" :title="name">
    <img v-if="image" :src="image" :alt="name" class="size-full object-cover" />
    <template v-else>{{ initials }}</template>
  </span>
</template>

<script setup>
import { usersStore } from '@/stores/users'
import { computed } from 'vue'

const props = defineProps({ user: { type: String, default: '' } })
const { getUser } = usersStore()

const name = computed(() => getUser(props.user)?.full_name || props.user)
const image = computed(() => getUser(props.user)?.user_image || '')
const initials = computed(() =>
  (name.value || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(''),
)
</script>
