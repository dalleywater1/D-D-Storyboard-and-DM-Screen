/* ===================== Linking on the Table =====================
   + Link mode (click a card, then the card it connects to), a link dot on
   each card you can drag onto another, click an arrow to label or delete it,
   and Show links: click a card to see only it and what it's linked to. */
Object.assign(S, { linkMode: false, linkFrom: null, focusMode: false, focus: null, focusDepth: 1, focusIds: null, linkEdit: null, dotDrag: null });
function computeFocus() {
  if (!S.focus || !S.cards.has(S.focus)) { S.focusIds = null; return; }
  const adj = new Map();
  const add = (a, b) => { if (!adj.has(a)) adj.set(a, new Set()); adj.get(a).add(b); };
  for (const c of S.cards.values()) for (const l of c.links || []) if (S.cards.has(l.to)) { add(c.id, l.to); add(l.to, c.id); }
  let ring = new Set([S.focus]); const seen = new Set([S.focus]);
  for (let d = 0; d < S.focusDepth; d++) {
    const next = new Set();
    for (const id of ring) for (const n of adj.get(id) || []) if (!seen.has(n)) { seen.add(n); next.add(n); }
    ring = next;
  }
  S.focusIds = seen;
}
function setFocus(id) { S.focus = S.focus === id ? null : id; computeFocus(); render(); }
function linkBar() {
  const lm = $("#link-mode"), fm = $("#focus-mode"), st = $("#link-status");
  if (!lm) return;
  lm.setAttribute("aria-pressed", S.linkMode); fm.setAttribute("aria-pressed", S.focusMode);
  lm.hidden = !S.canWrite;
  let msg = "";
  if (S.linkMode) msg = S.linkFrom ? `Linking from <b>${esc(S.cards.get(S.linkFrom)?.title || "card")}</b>. Click the card it connects to.` : "Click the card the link starts from.";
  else if (S.focusMode && !S.focus) msg = "Click a card to show only what it's linked to.";
  if (S.focus) {
    const n = (S.focusIds?.size || 1) - 1;
    msg = `Showing <b>${esc(S.cards.get(S.focus)?.title || "card")}</b> and ${n} linked card${n === 1 ? "" : "s"}
      <select id="focus-depth" aria-label="How far to follow links"><option value="1" ${S.focusDepth === 1 ? "selected" : ""}>Direct links</option><option value="2" ${S.focusDepth === 2 ? "selected" : ""}>Links of links too</option></select>
      <button type="button" class="btn small" id="focus-clear">Show everything</button>`;
  }
  st.innerHTML = msg; st.hidden = !msg;
}
function addLink(from, to) {
  if (!from || !to || from === to) return;
  const c = S.cards.get(from), t = S.cards.get(to); if (!c || !t) return;
  const links = c.links || [];
  if (links.some(l => l.to === to)) { toast(`“${c.title}” already links to “${t.title}”`); return; }
  if ((t.links || []).some(l => l.to === from)) { toast(`“${t.title}” already links to “${c.title}”`); return; }
  saveCard({ ...c, links: [...links, { to, label: "" }], updated: new Date().toISOString() });
  S.linkEdit = { from, n: links.length, value: "", fresh: true, born: performance.now() };
  if (S.focus) computeFocus();
  render();
}
function saveLinkLabel() {
  const le = S.linkEdit; if (!le) return;
  const c = S.cards.get(le.from); if (!c || !c.links?.[le.n]) { S.linkEdit = null; return; }
  const label = String(le.value || "").trim().slice(0, 40);
  if (label !== (c.links[le.n].label || "")) {
    const links = c.links.map((l, i) => i === le.n ? { ...l, label } : l);
    saveCard({ ...c, links, updated: new Date().toISOString() });
  }
  S.linkEdit = null; render();
}
function deleteLink() {
  const le = S.linkEdit; if (!le) return;
  const c = S.cards.get(le.from); if (!c) return;
  saveCard({ ...c, links: c.links.filter((_, i) => i !== le.n), updated: new Date().toISOString() });
  S.linkEdit = null; if (S.focus) computeFocus(); render(); toast("Link removed");
}
function linkPopHtml() {
  const le = S.linkEdit; if (!le || !S.boxes) return "";
  const c = S.cards.get(le.from), l = c?.links?.[le.n]; if (!l) return "";
  const a = S.boxes.get(c.id), b = S.boxes.get(l.to); if (!a || !b) return "";
  if (!le.fresh && le.value === "" && l.label) le.value = l.label;
  const x = (a.x + a.w / 2 + b.x + b.w / 2) / 2, y = (a.y + a.h / 2 + b.y + b.h / 2) / 2;
  return `<div class="link-pop" style="left:${x}px;top:${y}px" role="dialog" aria-label="Link">
    <div class="hint">${esc(c.title || "Card")} → ${esc(S.cards.get(l.to)?.title || "Card")}</div>
    <input id="link-label" value="${esc(le.value)}" placeholder="Label, e.g. betrays, leads to" aria-label="Link label" maxlength="40">
    <div class="actions"><button type="button" class="btn danger small" id="link-del">Delete link</button><button type="button" class="btn primary small" id="link-done">Done</button></div>
  </div>`;
}
/* ----- wire into the Table's render ----- */
const _renderCanvas = renderCanvas;
renderCanvas = function () {
  if (S.focus) computeFocus();
  _renderCanvas();
  const canvas = $("#canvas"); if (!canvas || drag) return;
  if (S.canWrite) for (const el of canvas.querySelectorAll("[data-cc]")) {
    if (!el.querySelector("[data-link-dot]")) el.insertAdjacentHTML("beforeend", `<div class="link-dot" data-link-dot="${el.dataset.cc}" title="Drag onto another card to link them" aria-hidden="true"></div>`);
    el.classList.toggle("link-src", el.dataset.cc === S.linkFrom);
    el.classList.toggle("focus-src", el.dataset.cc === S.focus);
  }
  canvas.classList.toggle("linking", S.linkMode || !!S.dotDrag);
  canvas.classList.toggle("focusing", S.focusMode || !!S.focus);
  const pop = linkPopHtml();
  if (pop) {
    canvas.insertAdjacentHTML("beforeend", pop);
    const inp = $("#link-label");
    if (inp) { inp.focus({ preventScroll: true }); inp.setSelectionRange(inp.value.length, inp.value.length); }
  }
  linkBar();
};
const _drawWires = drawWires;
drawWires = function () {
  _drawWires();
  const svg = document.getElementById("wires"); if (!svg || !S.boxes) return;
  let hits = "";
  for (const c of S.cards.values()) {
    const a = S.boxes.get(c.id); if (!a) continue;
    (c.links || []).forEach((l, n) => {
      const b = S.boxes.get(l.to); if (!b) return;
      const [x1, y1] = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2), [x2, y2] = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2);
      const faded = S.focusIds && !(S.focusIds.has(c.id) && S.focusIds.has(l.to));
      hits += `<path class="whit${faded ? " faded" : ""}" data-from="${esc(c.id)}" data-n="${n}" d="M${x1},${y1} L${x2},${y2}"><title>${esc(l.label || "Link")}: click to edit</title></path>`;
    });
  }
  if (S.focusIds) {
    // fade the drawn arrows and labels that leave the shown set
    const keep = [];
    for (const c of S.cards.values()) for (const l of c.links || []) if (S.boxes.get(c.id) && S.boxes.get(l.to)) keep.push(S.focusIds.has(c.id) && S.focusIds.has(l.to));
    let k = 0;
    for (const el of svg.querySelectorAll(":scope > path, :scope > text")) {
      if (el.tagName === "path") el.classList.toggle("faded", !keep[k++]);
      else el.classList.toggle("faded", !keep[k - 1]);
    }
  }
  svg.insertAdjacentHTML("beforeend", hits + `<path id="wire-temp" class="wire-temp" d=""/>`);
};
const _matches = matches;
matches = function (c) { if (S.focusIds && !S.focusIds.has(c.id)) return false; return _matches(c); };

/* ----- clicks on cards (link mode, focus mode), arrows, and the popover ----- */
const _endDrag = endDrag;
endDrag = function (e, cancelled) {
  if (drag && !drag.moved && !cancelled && drag.type !== "note" && (S.linkMode || S.focusMode)) {
    const id = drag.id; drag.el.classList.remove("moving"); drag = null;
    if (S.linkMode) {
      if (!S.linkFrom) { S.linkFrom = id; render(); }
      else if (S.linkFrom === id) { S.linkFrom = null; render(); }
      else { const f = S.linkFrom; S.linkFrom = null; addLink(f, id); }
    } else setFocus(id);
    return;
  }
  return _endDrag(e, cancelled);
};
document.addEventListener("click", e => {
  if (e.target.closest("#link-mode")) { S.linkMode = !S.linkMode; S.linkFrom = null; if (S.linkMode) S.focusMode = false; render(); return; }
  if (e.target.closest("#focus-mode")) { S.focusMode = !S.focusMode; if (S.focusMode) { S.linkMode = false; S.linkFrom = null; } else { S.focus = null; S.focusIds = null; } render(); return; }
  if (e.target.closest("#focus-clear")) { S.focus = null; S.focusIds = null; render(); return; }
  if (e.target.closest("#link-done")) { saveLinkLabel(); return; }
  if (e.target.closest("#link-del")) { deleteLink(); return; }
  const hit = e.target.closest(".whit");
  if (hit && S.canWrite) { S.linkEdit = { from: hit.dataset.from, n: Number(hit.dataset.n), value: "", born: performance.now() }; render(); return; }
  if (S.linkEdit && !e.target.closest(".link-pop") && performance.now() - (S.linkEdit.born || 0) > 350) { saveLinkLabel(); }
});
document.addEventListener("input", e => { if (e.target.id === "link-label" && S.linkEdit) { S.linkEdit.value = e.target.value; S.linkEdit.fresh = true; } });
document.addEventListener("change", e => { if (e.target.id === "focus-depth") { S.focusDepth = Number(e.target.value) || 1; computeFocus(); render(); } });
document.addEventListener("keydown", e => {
  if (e.target.id === "link-label" && e.key === "Enter") { e.preventDefault(); saveLinkLabel(); return; }
  if (e.key !== "Escape") return;
  if (S.linkEdit) { S.linkEdit = null; render(); return; }
  if (S.linkFrom) { S.linkFrom = null; render(); return; }
  if (S.linkMode) { S.linkMode = false; render(); return; }
  if (S.focus || S.focusMode) { S.focus = null; S.focusIds = null; S.focusMode = false; render(); }
});

/* ----- the line that follows the pointer, and dragging from a card's link dot ----- */
function canvasPoint(e) { const r = $("#canvas").getBoundingClientRect(); return [(e.clientX - r.left) / S.zoom, (e.clientY - r.top) / S.zoom]; }
function tempWire(fromId, e) {
  const p = document.getElementById("wire-temp"), a = S.boxes?.get(fromId); if (!p || !a) return;
  const [x, y] = canvasPoint(e), [x1, y1] = edgePoint(a, x, y);
  p.setAttribute("d", `M${x1},${y1} L${x},${y}`);
}
canvasEl.addEventListener("pointerdown", e => {
  const dot = e.target.closest("[data-link-dot]");
  if (!dot || e.button !== 0 || !S.canWrite) return;
  e.stopPropagation(); e.preventDefault();
  S.dotDrag = { from: dot.dataset.linkDot, pid: e.pointerId };
  $("#canvas").classList.add("linking");
  try { dot.setPointerCapture(e.pointerId); } catch {}
}, true);
canvasEl.addEventListener("pointermove", e => {
  if (S.dotDrag && e.pointerId === S.dotDrag.pid) {
    tempWire(S.dotDrag.from, e);
    document.querySelectorAll(".ccard.link-target").forEach(el => el.classList.remove("link-target"));
    const over = document.elementsFromPoint(e.clientX, e.clientY).find(el => el.matches?.("[data-cc]"));
    if (over && over.dataset.cc !== S.dotDrag.from) over.classList.add("link-target");
    return;
  }
  if (S.linkMode && S.linkFrom) tempWire(S.linkFrom, e);
});
function endDot(e, cancel) {
  if (!S.dotDrag || e.pointerId !== S.dotDrag.pid) return;
  const from = S.dotDrag.from; S.dotDrag = null;
  document.querySelectorAll(".ccard.link-target").forEach(el => el.classList.remove("link-target"));
  const over = !cancel && document.elementsFromPoint(e.clientX, e.clientY).find(el => el.matches?.("[data-cc]"));
  if (over && over.dataset.cc !== from) addLink(from, over.dataset.cc); else render();
}
document.addEventListener("pointerup", e => endDot(e, false));
document.addEventListener("pointercancel", e => endDot(e, true));
