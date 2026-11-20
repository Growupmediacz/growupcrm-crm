import ListIcon from '~icons/lucide/list'
import GroupByIcon from '~icons/lucide/rows-3'
import KanbanIcon from '~icons/lucide/kanban'
import { viewsStore } from '@/stores/views'
import { markRaw } from 'vue'

const { getView: getViewDetails } = viewsStore()

function standardView(type) {
  let types = {
    list: {
      label: __('List'),
      icon: markRaw(ListIcon),
    },
    group_by: {
      label: __('Group By'),
      icon: markRaw(GroupByIcon),
    },
    kanban: {
      label: __('Kanban'),
      icon: markRaw(KanbanIcon),
    },
  }

  return types[type]
}

export function getView(view, type, doctype) {
  let viewType = type || 'list'
  let viewDetails = getViewDetails(view, viewType, doctype)
  if (viewDetails && !viewDetails.icon) {
    viewDetails.icon = standardView(viewType).icon
  }
  return viewDetails || standardView(viewType)
}
