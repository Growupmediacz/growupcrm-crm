<template>
  <!-- GrowUp: panel hromadných akcí v seznamech místo anglického ListSelectBanner z frappe-ui.
       Česky, akce jsou vidět rovnou (Upravit, Smazat…), na mobilu se vejde na šířku displeje. -->
  <ListSelectBanner>
    <template #default="{ selections, allRowsSelected, selectAll, unselectAll }">
      <div class="gl-selbar">
        <span class="gl-selbar__count">
          <GlIcon name="check" :size="16" />
          {{ countText(selections.size) }}
        </span>
        <div class="gl-selbar__actions">
          <button
            v-for="a in actions(selections, unselectAll)"
            :key="a.label"
            type="button"
            class="gl-selbar__btn"
            :class="{ 'gl-selbar__btn--danger': a.danger }"
            @click="a.onClick()"
          >
            <GlIcon v-if="a.icon" :name="a.icon" :size="16" />
            {{ a.label }}
          </button>
        </div>
        <span class="gl-selbar__end">
          <button v-if="!allRowsSelected" type="button" class="gl-selbar__btn" @click="selectAll()">
            {{ __('Vybrat vše') }}
          </button>
          <button type="button" class="gl-selbar__close" :aria-label="__('Zrušit výběr')" :title="__('Zrušit výběr')" @click="unselectAll()">
            <GlIcon name="x" :size="16" />
          </button>
        </span>
      </div>
    </template>
  </ListSelectBanner>
</template>

<script setup>
import GlIcon from '@/components/GlIcon.vue'
import { ListSelectBanner } from 'frappe-ui'

const props = defineProps({
  // (selections, unselectAll) => [{ label, onClick }] z ListBulkActions.bulkActions
  bulkActions: { type: Function, required: true },
})

const ICONS = { Edit: 'edit', Delete: 'trash', 'Assign To': 'user', 'Clear Assignment': 'x', 'Convert to Deal': 'arrow' }
const ICON_BY_LABEL = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [__(k), v]))

function actions(selections, unselectAll) {
  return (props.bulkActions(selections, unselectAll) || []).map((a) => ({
    ...a,
    icon: ICON_BY_LABEL[a.label],
    danger: a.label === __('Delete'),
  }))
}

function countText(n) {
  if (n === 1) return __('Vybrán 1 záznam')
  if (n >= 2 && n <= 4) return __('Vybrány {0} záznamy', [n])
  return __('Vybráno {0} záznamů', [n])
}
</script>

<style>
/* obal (bílá pilulka, šířka na mobilu) je v theme.css, sekce hromadné akce */
.gl-selbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  width: 100%;
}
.gl-selbar__count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--ink-gray-9, #14181f);
  white-space: nowrap;
}
.gl-selbar__count .gl-icon {
  width: 22px !important;
  height: 22px !important;
  padding: 3px;
  border-radius: 7px;
  background: var(--brand-primary, #4f46e5);
  color: #fff;
}
.gl-selbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.gl-selbar__end {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
}
.gl-selbar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-gray-8, #1f2430);
  background: rgba(110, 120, 200, 0.08);
  white-space: nowrap;
}
.gl-selbar__btn:hover {
  background: rgba(110, 120, 200, 0.16);
}
.gl-selbar__btn--danger {
  color: #b42318;
  background: rgba(208, 54, 42, 0.08);
}
.gl-selbar__btn--danger:hover {
  background: rgba(208, 54, 42, 0.16);
}
.gl-selbar__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  color: var(--ink-gray-6, #555c6b);
}
.gl-selbar__close:hover {
  background: rgba(110, 120, 200, 0.1);
}
</style>
