// GrowUp: dokončení úkolu s možností „Zpět“ v oznámení (design: Dnes → úkol dokončen).
import { call, toast } from 'frappe-ui'

/**
 * Označí úkol jako hotový a ukáže oznámení s tlačítkem Zpět, které vrátí původní stav.
 * @param {string} name   název CRM Task
 * @param {string} title  titulek úkolu do oznámení
 * @param {() => void} onChange  zavolá se po dokončení i po vrácení (obnova dat)
 */
export async function completeTaskWithUndo(name, title, onChange) {
  const previous = (await call('frappe.client.get_value', {
    doctype: 'CRM Task',
    filters: { name },
    fieldname: 'status',
  }))?.status || 'Todo'
  await call('frappe.client.set_value', { doctype: 'CRM Task', name, fieldname: 'status', value: 'Done' })
  onChange?.()
  toast.success(title ? __('Hotovo: {0}', [title]) : __('Úkol je hotový'), {
    duration: 8000,
    action: {
      label: __('Zpět'),
      onClick: async () => {
        await call('frappe.client.set_value', { doctype: 'CRM Task', name, fieldname: 'status', value: previous })
        toast(__('Úkol je zpět mezi otevřenými'))
        onChange?.()
      },
    },
  })
}
