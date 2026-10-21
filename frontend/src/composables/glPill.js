// Posuvná pilulka pod vybranou záložkou: měří vybraný prvek a nastaví proměnné pro CSS (.gl-pill-on).
// Čipy aktivity (.gl-chiptabs) a navigační lišty s atributem data-gl-pill="<selektor aktivní položky>",
// volitelně data-gl-pill-target="<selektor uvnitř položky>" (levé menu: jen čtvereček ikony).
function place(list, selector = '[role="tab"][aria-selected="true"]') {
  let sel = list.querySelector(selector)
  if (sel && list.dataset.glPillTarget) sel = sel.querySelector(list.dataset.glPillTarget) || sel
  if (!sel) return list.classList.contains('gl-pill-on') && list.classList.remove('gl-pill-on')
  const lr = list.getBoundingClientRect()
  const sr = sel.getBoundingClientRect()
  if (!sr.width) return
  list.style.setProperty('--pill-x', `${sr.left - lr.left + list.scrollLeft}px`)
  list.style.setProperty('--pill-y', `${sr.top - lr.top}px`)
  list.style.setProperty('--pill-w', `${sr.width}px`)
  list.style.setProperty('--pill-h', `${sr.height}px`)
  if (!list.classList.contains('gl-pill-on')) {
    // první umístění bez animace, pak teprve přejezdy
    list.classList.add('gl-pill-on')
    requestAnimationFrame(() => requestAnimationFrame(() => list.classList.add('gl-pill-anim')))
  }
}

export function initTabPill() {
  let queued = false
  const run = () => {
    queued = false
    document.querySelectorAll('.gl-chiptabs [role="tablist"]').forEach((l) => place(l))
    document.querySelectorAll('[data-gl-pill]').forEach((l) => place(l, l.dataset.glPill))
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(run)
  }
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['aria-selected', 'aria-current', 'class'],
  })
  window.addEventListener('resize', schedule)
}
