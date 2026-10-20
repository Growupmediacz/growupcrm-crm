export class CRMTask {
  onRender() {
    if (this.doc.reference_doctype && this.doc.reference_docname) {
      // GrowUp: česky a i pro záznam u Firmy (dřív vedl na Zakázku → „Dokument nenalezen“)
      const target = {
        'CRM Lead': { label: __('Otevřít zakázku'), name: 'Lead', param: 'leadId' },
        'CRM Deal': { label: __('Otevřít obchod'), name: 'Deal', param: 'dealId' },
        'CRM Organization': { label: __('Otevřít firmu'), name: 'Organization', param: 'organizationId' },
      }[this.doc.reference_doctype]
      if (!target) return
      this.actions = [
        {
          name: 'Redirect Action',
          label: target.label,
          onClick: (close) => {
            if (!this.doc.reference_docname) return
            this.router.push({ name: target.name, params: { [target.param]: this.doc.reference_docname } })
            close?.()
          },
        },
      ]
    }
  }
}
