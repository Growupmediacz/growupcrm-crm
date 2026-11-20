// GrowUp (zadání 2027 E1): rozhraní pro návrhy agenta pod vláknem.
// Skutečné návrhy: growupcrm.proposals.for_thread / proposals.decide (D2, napojeno v E3);
// ukázkový návrh se zobrazí jen s ?agent=ukazka v adrese (nikdy samovolně).
//
// Tvar návrhu (dohoda s týmem agenta):
// {
//   id, kind: 'reply', level: 'ke schválení' | 'vždy člověk',
//   happened: 'co se stalo (jedna věta)',
//   reason: 'důvod v jedné větě', why: ['2–4 odrážky: z čeho agent vyšel, co udělá po schválení'],
//   to: ['adresa'], subject, html,        // text návrhu; místa k doplnění jako „DOPLNIT CENU“
//   created_at,
// }
// Rozhodnutí: decide(id, 'approved' | 'edited' | 'rejected', final_html)
import { call } from 'frappe-ui'

export function demoEnabled() {
  return new URLSearchParams(location.search).get('agent') === 'ukazka'
}

export async function proposalForThread(reference, thread) {
  // zadání 2027 E3: skutečné návrhy z growupcrm.proposals.for_thread (D2); ukázka jen s ?agent=ukazka
  if (!demoEnabled()) {
    if (!thread?.id || reference?.doctype !== 'CRM Lead') return null
    try {
      return (await call('growupcrm.proposals.for_thread', {
        reference_doctype: reference.doctype,
        reference_name: reference.name,
        thread_id: thread.id,
      })) || null
    } catch {
      return null // bez práv ke kampaním (obchodník) se návrh neukáže
    }
  }
  if (!thread || thread.state !== 'us') return null
  const last = [...(thread.messages || [])].reverse().find((m) => m.sent_or_received === 'Received' && !m.automated)
  if (!last) return null
  const surname = (last.sender_name || '').split(' ').slice(-1)[0]
  return {
    id: 'ukazka-' + thread.id,
    kind: 'reply',
    level: 'ke schválení',
    demo: true,
    happened: __('Zájemce odpověděl na ukázku webu'),
    reason: __('Ptá se na formulář, fotky, cenu a termín; chce hovor ve čtvrtek dopoledne.'),
    why: [
      __('Typ odpovědi: Zájem (z pravidel třídění).'),
      __('Cenu agent nepíše, to je vždy na vás. V textu je místo k doplnění.'),
      __('Po odeslání založí úkol „Zavolat“ na čtvrtek 9:30.'),
    ],
    to: [last.sender],
    subject: 'Re: ' + (thread.subject || ''),
    html: `<p>${__('Dobrý den, pane {0},', [surname || ''])}</p><p>${__('děkuji, to mě těší. Formulář s výběrem tam bude, je to běžná součást webu. Fotky z mobilu nevadí, vybereme ty nejlepší a upravíme je.')}</p><p>${__('Cena celého webu vychází na DOPLNIT CENU, hotovo bývá do čtyř týdnů od dodání podkladů. Zavolám vám ve čtvrtek v 9:30.')}</p><p>${__('S pozdravem')}</p>`,
    created_at: new Date().toISOString(),
  }
}

export async function decideProposal(proposal, result, finalHtml = '') {
  if (proposal.demo) return
  // výsledek se zapíše do učení agenta; nic neodesílá (odeslání proběhlo editorem přes mail_threads.send)
  await call('growupcrm.proposals.decide', { name: proposal.id, result, ...(finalHtml ? { final_html: finalHtml } : {}) })
}

// zadání 2027 E3: rozhodnutí o návrhu zapsat až po uplynutí „Vrátit zpět“ (když člověk odeslání vrátí,
// návrh zůstane čekat) a s odeslaným textem; „approved“ jen když se text nezměnil.
const norm = (h) => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()
export function decideAfterUndo(proposal, sent, { onDone } = {}) {
  if (!proposal || proposal.demo || !sent?.name) return
  const waitMs = sent.send_after ? Math.max(0, new Date(String(sent.send_after).replace(' ', 'T')) - new Date()) + 3000 : 0
  setTimeout(async () => {
    try {
      const still = await call('frappe.client.get_value', { doctype: 'Communication', filters: { name: sent.name }, fieldname: 'name' })
      if (!still?.name) return // odeslání vráceno: návrh zůstává ve frontě
      const result = norm(sent.html) === norm(proposal.html) ? 'approved' : 'edited'
      await call('growupcrm.proposals.decide', { name: proposal.id, result, final_html: sent.html || '' })
      onDone?.()
    } catch {
      /* záchranná síť: proposals.for_thread návrh srovná při dalším otevření vlákna */
    }
  }, waitMs)
}
