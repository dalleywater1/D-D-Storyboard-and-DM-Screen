/* ===================== DM Screen grid =====================
   A snap-to-grid dashboard. The screen has as many columns as fit (340 px
   minimum each); rows are 8 px. Each panel has a column (x), a row (y), a
   width in columns and a height (its content, or a fixed height you set).
   Panels fall upwards into free space, and anything a moved panel lands on
   is pushed down, so panels can sit under each other in any column.
   Positions, sizes and looks are saved per campaign in screen/layout. */
const SCREEN_ROW = 8, SCREEN_GAP = 16;
const LOOK_TEXT = [["s", "Small"], ["m", "Normal"], ["l", "Large"]];
S.stylePanel = null;
function layoutDoc() { return S.mod.screen.get("layout") || {}; }
function panelLook(id) { const l = (layoutDoc().look || {})[id] || {}; return { c: COLORS.includes(l.c) ? l.c : "", t: ["s", "l"].includes(l.t) ? l.t : "m" }; }
function styleMenu(p) {
  const lk = panelLook(p.id);
  return `<div class="pstyle" role="dialog" aria-label="Colour and text size for ${esc(p.title)}">
    <div class="swatches">${COLORS.map(c => `<button type="button" class="sw" data-do="panel-color" data-id="${p.id}" data-c="${c}" style="${c ? `--sw:var(--c-${c})` : ""}" aria-pressed="${lk.c === c}" aria-label="${COLOR_NAMES[c]}" title="${COLOR_NAMES[c]}"></button>`).join("")}</div>
    <div class="seg" role="group" aria-label="Text size">${LOOK_TEXT.map(([t, l]) => `<button type="button" data-do="panel-text" data-id="${p.id}" data-t="${t}" aria-pressed="${lk.t === t}">${l}</button>`).join("")}</div>
  </div>`;
}
function screenCols(grid) { const w = grid.clientWidth; return Math.max(1, Math.floor((w + SCREEN_GAP) / (Math.min(340, w) + SCREEN_GAP))); }
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
function settle(it, placed) {
  let y = Math.max(0, it.y);
  while (y > 0 && !placed.some(p => overlaps({ ...it, y: y - 1 }, p))) y--;
  let hit;
  while ((hit = placed.find(p => overlaps({ ...it, y }, p)))) y = hit.y + hit.h;
  return y;
}
/* Place every item. `fixed` (the one being dragged) keeps its exact spot;
   the others keep their saved order and fall upwards around it. Items that
   were never placed go into the column that ends highest. */
function arrange(items, C, fixed) {
  const placed = fixed ? [fixed] : [];
  const known = items.filter(i => i !== fixed && i.y != null).sort((a, b) => a.y - b.y || a.x - b.x || (a.first ? -1 : 0));
  for (const it of known) { it.y = settle(it, placed); placed.push(it); }
  for (const it of items.filter(i => i !== fixed && i.y == null)) {
    let best = null;
    for (let x = 0; x <= C - it.w; x++) { const y = settle({ ...it, x, y: 0 }, placed); if (!best || y < best.y) best = { x, y }; }
    Object.assign(it, best); placed.push(it);
  }
  return items;
}
function gridItems(grid) {
  const C = screenCols(grid), pos = layoutDoc().pos || {};
  const items = [...grid.querySelectorAll(":scope > section.panel")].map(el => {
    const id = el.id.slice(6), w = el.dataset.cols === "all" ? C : clamp(int(el.dataset.cols) || 1, 1, C), p = pos[id];
    return { id, el, w, x: p ? clamp(int(p.x), 0, C - w) : 0, y: p ? int(p.y) : null, h: 1 };
  });
  // measure each panel at its width
  for (const it of items) {
    it.el.style.gridColumn = `${it.x + 1} / span ${it.w}`; it.el.style.gridRow = "1 / span 1";
    const fh = int(it.el.dataset.h); it.el.style.height = fh ? fh + "px" : "";
    it.el.classList.toggle("fixed", !!fh); it.el.classList.toggle("full", it.w === C && C > 1);
  }
  for (const it of items) it.h = Math.max(1, Math.ceil((it.el.getBoundingClientRect().height + SCREEN_GAP) / SCREEN_ROW));
  return { C, items };
}
function applyGrid(items) { for (const it of items) { it.el.style.gridColumn = `${it.x + 1} / span ${it.w}`; it.el.style.gridRow = `${it.y + 1} / span ${it.h}`; } }
let screenRO = null;
function layoutScreen() {
  const grid = document.querySelector("#module .screen-grid"); if (!grid || pmove) return;
  const { C, items } = gridItems(grid);
  grid.style.gridTemplateColumns = `repeat(${C}, minmax(0, 1fr))`;
  applyGrid(arrange(items, C));
  if (!screenRO && window.ResizeObserver) screenRO = new ResizeObserver(() => { cancelAnimationFrame(layoutScreen.raf); layoutScreen.raf = requestAnimationFrame(layoutScreen); });
  if (screenRO) items.forEach(it => screenRO.observe(it.el));
}
window.addEventListener("resize", () => { if (S.tab === "screen") layoutScreen(); });
function savePositions(items, extra) {
  const pos = Object.fromEntries(items.map(it => [it.id, { x: it.x, y: it.y }]));
  const lay = docCopy("screen", "layout");
  lay.pos = pos;
  lay.order = [...items].sort((a, b) => a.y - b.y || a.x - b.x).map(it => it.id).concat((lay.order || []).filter(id => !pos[id]));
  if (extra) extra(lay);
  putDoc("screen", "layout", lay);
}

/* ----- moving: drag (mouse or touch) from the grip or a heading, or arrow keys on the grip ----- */
let pmove = null;
document.addEventListener("pointerdown", e => {
  if (S.tab !== "screen" || e.button !== 0 || !S.canWrite) return;
  const grip = e.target.closest("[data-grip-panel]");
  const head = !grip && e.pointerType === "mouse" && e.target.closest("#module section.panel > .pbody > h2");
  if (!grip && !head) return;
  const sec = (grip || head).closest("section.panel"), grid = sec?.parentElement; if (!sec || !grid) return;
  e.preventDefault();
  const r = sec.getBoundingClientRect();
  pmove = { id: sec.id.slice(6), sec, grid, sx: e.clientX, sy: e.clientY, gx: e.clientX - r.left, gy: e.clientY - r.top, moved: false, pid: e.pointerId, tx: 0, ty: 0 };
  try { (grip || head).setPointerCapture(e.pointerId); } catch {}
});
document.addEventListener("pointermove", e => {
  if (!pmove || e.pointerId !== pmove.pid) return;
  const m = pmove;
  if (!m.moved) {
    if (Math.hypot(e.clientX - m.sx, e.clientY - m.sy) < 6) return;
    m.moved = true; S.holdRender = true;
    const g = gridItems(m.grid); m.C = g.C; m.items = g.items; m.base = g.items.map(it => ({ id: it.id, x: it.x, y: it.y }));
    arrange(m.items, m.C); m.base = m.items.map(it => ({ id: it.id, x: it.x, y: it.y }));
    m.it = m.items.find(it => it.id === m.id);
    m.ph = document.createElement("div"); m.ph.className = "slot-ph"; m.grid.appendChild(m.ph);
    m.sec.classList.add("lifted"); document.body.classList.add("panel-dragging");
  }
  const gr = m.grid.getBoundingClientRect(), colW = (gr.width - SCREEN_GAP * (m.C - 1)) / m.C;
  const x = clamp(Math.round((e.clientX - m.gx - gr.left) / (colW + SCREEN_GAP)), 0, m.C - m.it.w);
  const raw = Math.max(0, Math.round((e.clientY - m.gy - gr.top) / SCREEN_ROW));
  for (const it of m.items) { const b = m.base.find(q => q.id === it.id); it.x = b.x; it.y = b.y; }
  // go under every panel in these columns whose middle is above the drop point
  let ty = 0;
  for (const o of m.items) if (o !== m.it && o.x < x + m.it.w && x < o.x + o.w && o.y + o.h / 2 < raw) ty = Math.max(ty, o.y + o.h);
  m.it.x = x; m.it.y = ty;
  arrange(m.items, m.C, m.it);
  applyGrid(m.items);
  m.ph.style.gridColumn = m.sec.style.gridColumn; m.ph.style.gridRow = `${m.it.y + 1} / span ${Math.max(1, m.it.h - 2)}`;
  // keep the panel under the pointer while its slot moves
  m.sec.style.transform = "";
  const slot = m.sec.getBoundingClientRect();
  m.sec.style.transform = `translate(${e.clientX - m.gx - slot.left}px, ${e.clientY - m.gy - slot.top}px)`;
  const edge = 70;
  if (e.clientY < edge) window.scrollBy(0, -Math.ceil((edge - e.clientY) / 4));
  else if (e.clientY > innerHeight - edge) window.scrollBy(0, Math.ceil((e.clientY - innerHeight + edge) / 4));
});
function endMove(e, cancel) {
  if (!pmove || (e && e.pointerId !== pmove.pid)) return;
  const m = pmove; pmove = null;
  S.holdRender = false;
  if (!m.moved) return;
  m.ph?.remove(); m.sec.style.transform = ""; m.sec.classList.remove("lifted"); document.body.classList.remove("panel-dragging");
  if (cancel) { render(); return; }
  m.it.first = true;
  arrange(m.items, m.C); delete m.it.first;
  applyGrid(m.items);
  savePositions(m.items);
}
document.addEventListener("pointerup", e => endMove(e, false));
document.addEventListener("pointercancel", e => endMove(e, true));
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && pmove) { endMove({ pointerId: pmove.pid }, true); return; }
  const grip = e.target.closest?.("[data-grip-panel]");
  if (!grip || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
  e.preventDefault();
  const grid = grip.closest(".screen-grid"); if (!grid) return;
  const { C, items } = gridItems(grid); arrange(items, C);
  const it = items.find(i => i.id === grip.dataset.gripPanel); if (!it) return;
  const cols = o => o.x < it.x + it.w && it.x < o.x + o.w;
  if (e.key === "ArrowLeft") it.x = Math.max(0, it.x - 1);
  if (e.key === "ArrowRight") it.x = Math.min(C - it.w, it.x + 1);
  if (e.key === "ArrowUp") { const above = items.filter(o => o !== it && cols(o) && o.y < it.y).sort((a, b) => b.y - a.y)[0]; if (above) it.y = above.y; it.first = true; }
  if (e.key === "ArrowDown") { const below = items.filter(o => o !== it && cols(o) && o.y > it.y).sort((a, b) => a.y - b.y)[0]; if (below) it.y = below.y + below.h; }
  arrange(items, C, it); arrange(items, C); delete it.first;
  savePositions(items);
  setTimeout(() => document.querySelector(`[data-grip-panel="${it.id}"]`)?.focus(), 40);
});

/* ----- resizing from the corner handle ----- */
let prs = null;
document.addEventListener("pointerdown", e => {
  const hdl = e.target.closest("[data-resize-panel]");
  if (!hdl || e.button !== 0 || !S.canWrite) return;
  e.preventDefault();
  const sec = hdl.closest("section.panel"), grid = sec.parentElement, C = screenCols(grid);
  const colW = (grid.clientWidth - SCREEN_GAP * (C - 1)) / C;
  prs = { id: hdl.dataset.resizePanel, sec, grid, C, colW, x: e.clientX, y: e.clientY, w: sec.offsetWidth, h: sec.offsetHeight, startH: int(sec.dataset.h), nc: null, nh: null, pid: e.pointerId, tag: null };
  S.holdRender = true;
  try { hdl.setPointerCapture(e.pointerId); } catch {}
  document.body.classList.add("panel-resizing");
});
document.addEventListener("pointermove", e => {
  if (!prs || e.pointerId !== prs.pid) return;
  const dx = e.clientX - prs.x, dy = e.clientY - prs.y;
  prs.nc = clamp(Math.round((prs.w + dx + SCREEN_GAP) / (prs.colW + SCREEN_GAP)), 1, prs.C);
  if (Math.abs(dy) > 4 || prs.startH) prs.nh = Math.max(140, Math.round((prs.h + dy) / 10) * 10);
  prs.sec.dataset.cols = prs.nc;
  if (prs.nh) prs.sec.dataset.h = prs.nh;
  layoutScreen();
  if (!prs.tag) { prs.tag = document.createElement("div"); prs.tag.className = "drag-ghost"; document.body.appendChild(prs.tag); }
  prs.tag.textContent = `${prs.nc} column${prs.nc === 1 ? "" : "s"} · ${prs.nh ? prs.nh + " px tall" : "auto height"}`;
  prs.tag.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 10}px)`;
});
function endResize(e, cancel) {
  if (!prs || (e && e.pointerId !== prs.pid)) return;
  const r = prs; prs = null;
  r.tag?.remove(); document.body.classList.remove("panel-resizing");
  S.holdRender = false;
  if (cancel || r.nc == null) { render(); return; }
  const { C, items } = gridItems(r.grid); arrange(items, C);
  savePositions(items, lay => { lay.sizes = { ...(lay.sizes || {}), [r.id]: { cols: r.nc >= r.C && r.C > 1 ? "all" : r.nc, h: r.nh || r.startH || 0 } }; });
}
document.addEventListener("pointerup", e => endResize(e, false));
document.addEventListener("pointercancel", e => endResize(e, true));
document.addEventListener("dblclick", e => {
  const hdl = e.target.closest("[data-resize-panel]"); if (!hdl || !S.canWrite) return;
  const p = allPanels().find(x => x.id === hdl.dataset.resizePanel); if (!p) return;
  commit("screen", "layout", "sizes." + p.id, { cols: panelSize(p).cols, h: 0 });
  render(); toast("Height set to fit");
});

/* ----- colour and text size ----- */
Object.assign(ACTIONS, {
  "panel-style": d => { S.stylePanel = S.stylePanel === d.id ? null : d.id; renderModule(); },
  "panel-color": d => { commit("screen", "layout", "look." + d.id, { ...panelLook(d.id), c: d.c }); render(); },
  "panel-text": d => { commit("screen", "layout", "look." + d.id, { ...panelLook(d.id), t: d.t }); render(); },
});
document.addEventListener("click", e => {
  if (S.stylePanel && !e.target.closest(".pstyle, [data-do='panel-style']")) { S.stylePanel = null; if (S.tab === "screen") renderModule(); }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && S.stylePanel) { S.stylePanel = null; renderModule(); } });
