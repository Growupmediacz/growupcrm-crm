// GrowUp (zadání 2027 kolo 2 V2): srozumitelné popisky akcí agenta pro záznam (karta „Agent udělal sám“, stránka Záznam agenta).
// Technický název nástroje zůstává jen v detailu záznamu a v atributu title.

let cache = null

// mapa se sestaví až při prvním použití, aby už byly načtené překlady
function actions() {
  if (cache) return cache
  const preview = __('Připravil e-mail s ukázkou')
  const reply = __('Zařadil odpověď')
  const approve = __('Schválil týden')
  const phase = __('Posunul fázi webu')
  const propose = __('Navrhl odpověď')
  const reasoning = __('Zapsal zdůvodnění')
  cache = {
    add_note: __('Zapsal poznámku'),
    add_task: __('Založil úkol'),
    apply_reply_type: reply,
    set_reply_type: reply,
    approve_week: approve,
    weekly_approve: approve,
    'growupcrm.weekly.approve': approve,
    check_drafts: __('Zkontroloval koncepty'),
    create_week: __('Připravil týden kampaně'),
    delete_lead: __('Pokus o smazání zakázky'),
    get_goal_plan: __('Přečetl plán cílů'),
    get_learning: __('Přečetl učení'),
    get_pool: __('Prošel zásobu firem'),
    get_reply_context: __('Přečetl odpověď firmy'),
    get_today: __('Přečetl frontu Dnes'),
    get_week_report: __('Přečetl výsledky týdne'),
    get_writing_context: __('Načetl podklady k psaní'),
    'growupcrm.webs.set_phase': phase,
    set_web_phase: phase,
    import_drafts: __('Nahrál e-maily ke schválení'),
    list_decisions: __('Prošel vaše rozhodnutí'),
    list_replies: __('Prošel nové odpovědi'),
    prepare_preview_email: preview,
    'sales_agent.preview_for_lead': preview,
    propose_reply: propose,
    'sales_agent.propose_reply': propose,
    record_reasoning: reasoning,
    'sales_agent.record_reasoning': reasoning,
    'sales_agent.handle_reply': __('Zpracoval odpověď'),
    'sales_agent.refuse': __('Odmítl akci (vždy člověk)'),
    save_learning: __('Zapsal učení'),
    score_company: __('Ohodnotil firmu'),
    search: __('Hledal v CRM'),
    send_drafts: __('Pokus o odeslání (zakázáno)'),
    set_preview_link: __('Vložil odkaz na ukázku'),
    set_enabled: __('Změna vypínače agenta'),
    get_lead: __('Přečetl zakázku'),
    get_thread: __('Přečetl vlákno'),
    get_organization: __('Přečetl firmu'),
    get_web: __('Přečetl web'),
    list_tasks: __('Prošel úkoly'),
    list_drafts: __('Prošel koncepty'),
    get_stats: __('Přečetl přehled čísel'),
    get_funnel: __('Přečetl přehled obchodního trychtýře'),
    get_attribution: __('Přečetl přehled zdrojů zakázek'),
    get_invoice_summary: __('Přečetl přehled faktur'),
  }
  return cache
}

// „a.b_c“ → „b c“ (jen poslední část, podtržítka na mezery)
function fallback(tool) {
  const last = String(tool).split('.').pop().replace(/_/g, ' ').trim()
  return __('Akce: {0}', [last || String(tool)])
}

export function agentActionLabel(tool) {
  if (!tool) return __('Akce agenta')
  return actions()[tool] || fallback(tool)
}
