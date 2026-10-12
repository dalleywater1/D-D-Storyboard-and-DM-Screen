/* ---------- tabs & modules ----------
   Each tab is a module: { id, label, gm?, render }. The Storyboard tab is the
   board itself; every other module renders into #module. Module data that is
   GM-only lives at gmx/<campaign>/<collection>; NPCs and Towns are storyboard
   cards (kind "npc" / "town") with extra fields, so they show on the board too. */
const MODULES = [
  { id: "board", label: "Storyboard" },
  { id: "sessions", label: "Sessions", gm: true, render: () => renderSessions() },
  { id: "plot", label: "Meta Plot", gm: true, render: () => renderPlot() },
  { id: "npcs", label: "NPCs", render: () => renderNpcs() },
  { id: "towns", label: "Towns", render: () => renderTowns() },
  { id: "combats", label: "Combats", gm: true, render: () => renderCombats() },
  { id: "screen", label: "DM Screen", render: () => renderScreen() },
];
const MOD_COLLS = ["sessions", "plot", "combats", "screen"];
const CARD_EXTRA = ["role", "town", "attitude", "life", "voice", "wants", "size", "population", "ruler", "places", "rumors"];
function MP(coll, b = S.board) { return "gmx/" + b + "/" + coll; }
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function int(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }
function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
function pill(text, tone) { return `<span class="pill ${tone}">${esc(text)}</span>`; }

Object.assign(S, {
  tab: lsGet("sb-tab", "board"),
  tabPrefs: Object.assign({ order: [], hidden: [] }, lsGet("sb-tabs", {})),
  mod: { sessions: new Map(), plot: new Map(), combats: new Map(), screen: new Map() },
  sel: {}, drafts: new Map(), modQ: { npcs: "", npcTown: "", towns: "" }, confirm: null,
  spell: { q: "", lvl: "all" },
  screenOff: lsGet("sb-screen-off", []),
});

/* ----- tab bar ----- */
function tabOrder() {
  const ids = MODULES.map(m => m.id).filter(id => id !== "board");
  const order = (S.tabPrefs.order || []).filter(id => ids.includes(id));
  for (const id of ids) if (!order.includes(id)) order.push(id);
  return ["board", ...order];
}
function modById(id) { return MODULES.find(m => m.id === id); }
function shownTabs() {
  return tabOrder().map(modById).filter(m => (!m.gm || S.canGM) && (m.id === "board" || !(S.tabPrefs.hidden || []).includes(m.id)));
}
function cardsOf(kind) { return [...S.cards.values()].filter(c => c.kind === kind && !c.archived).sort((a, b) => String(a.title).localeCompare(String(b.title))); }
function tabCount(id) {
  return { sessions: S.mod.sessions.size, plot: S.mod.plot.size, npcs: cardsOf("npc").length, towns: cardsOf("town").length, combats: S.mod.combats.size }[id] || 0;
}
function renderTabs() {
  const tabs = shownTabs();
  if (!tabs.some(t => t.id === S.tab)) S.tab = "board";
  $("#tabs").innerHTML = tabs.map(m => {
    const n = tabCount(m.id);
    return `<button type="button" role="tab" class="tab" data-tab="${m.id}" aria-selected="${m.id === S.tab}">${m.label}${n ? `<span class="n">${n}</span>` : ""}</button>`;
  }).join("") + `<button type="button" class="tab tab-more" data-do="tabs-arrange" aria-label="Show, hide or reorder tabs" title="Show, hide or reorder tabs">⋯</button>`;
}
function setTab(id) { flushAll(); S.tab = id; S.confirm = null; lsSet("sb-tab", id); render(); }
function renderTabSheet() {
  const order = tabOrder();
  $("#tabs-list").innerHTML = order.map((id, i) => {
    const m = modById(id), fixed = id === "board", on = fixed || !S.tabPrefs.hidden.includes(id);
    return `<li class="tabrow"><label><input type="checkbox" data-tabshow="${id}" ${on ? "checked" : ""} ${fixed ? "disabled" : ""}> ${m.label}${m.gm ? ` <span class="hint">GM only</span>` : ""}</label>
      ${fixed ? `<span class="hint">Always first</span>` : `<span class="actions">
        <button type="button" class="icon-btn" data-do="tab-move" data-id="${id}" data-dir="-1" aria-label="Move ${m.label} earlier" ${i <= 1 ? "disabled" : ""}>↑</button>
        <button type="button" class="icon-btn" data-do="tab-move" data-id="${id}" data-dir="1" aria-label="Move ${m.label} later" ${i === order.length - 1 ? "disabled" : ""}>↓</button></span>`}</li>`;
  }).join("");
}

/* ----- rendering a module ------
   The new HTML is patched into the live DOM (morphed) instead of replacing it,
   so the field being typed in, or the one being clicked into, is never torn
   down mid-gesture. Children with an id are matched by id so reordered rows
   keep their elements. */
function morphChildren(from, to) {
  const want = [...to.childNodes];
  want.forEach((t, n) => {
    let f = from.childNodes[n];
    if (t.nodeType === 1 && t.id && (!f || f.id !== t.id)) {
      const match = [...from.children].find(c => c.id === t.id);
      if (match) { from.insertBefore(match, f || null); f = match; }
    }
    if (!f) from.appendChild(t.cloneNode(true));
    else if (f.nodeType === t.nodeType && (f.nodeType !== 1 || (f.tagName === t.tagName && (f.id || "") === (t.id || "")))) {
      if (f.nodeType === 1) morphEl(f, t); else if (f.nodeValue !== t.nodeValue) f.nodeValue = t.nodeValue;
    } else from.replaceChild(t.cloneNode(true), f);
  });
  while (from.childNodes.length > want.length) from.removeChild(from.lastChild);
}
function morphEl(from, to) {
  for (const a of [...from.attributes]) if (!to.hasAttribute(a.name)) from.removeAttribute(a.name);
  for (const a of [...to.attributes]) if (from.getAttribute(a.name) !== a.value) from.setAttribute(a.name, a.value);
  const focused = from === document.activeElement;
  if (from.tagName === "TEXTAREA") { if (!focused && from.value !== to.value) from.value = to.value; return; }
  if (from.tagName === "INPUT") {
    if (from.type === "checkbox" || from.type === "radio") from.checked = to.hasAttribute("checked");
    else { const v = to.getAttribute("value") ?? ""; if (!focused && from.value !== v) from.value = v; }
    return;
  }
  morphChildren(from, to);
  if (from.tagName === "SELECT") { const o = to.querySelector("option[selected]"); from.value = o ? o.value : (from.options[0]?.value ?? ""); }
}
let modRendering = false, modRenderAgain = false;
function renderModule() {
  if (S.holdRender) return;
  if (modRendering) { modRenderAgain = true; return; }
  modRendering = true;
  const root = $("#module");
  try {
    do {
      modRenderAgain = false;
      const a = document.activeElement;
      let keep = null;
      if (a && root.contains(a)) { keep = { el: a }; try { keep.s = a.selectionStart; keep.e = a.selectionEnd; } catch {} }
      const m = modById(S.tab);
      const html = !S.loaded ? `<div class="mempty-detail"><p>Opening your campaign…</p></div>` : (m && m.render ? m.render() : "");
      if (root.dataset.mod !== S.tab) { root.innerHTML = html; root.dataset.mod = S.tab; }
      else { const tpl = document.createElement("template"); tpl.innerHTML = html; morphChildren(root, tpl.content); }
      if (keep && keep.el.isConnected && document.activeElement !== keep.el) {
        keep.el.focus({ preventScroll: true });
        try { if (keep.s != null) keep.el.setSelectionRange(keep.s, keep.e); } catch {}
      }
    } while (modRenderAgain);
    if (S.tab === "screen") layoutScreen();
  } finally { modRendering = false; }
}

/* ----- field binding: data-m (store) / data-i (doc id) / data-p (field path) ----- */
function getPath(o, path) { return path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o); }
function setPath(o, path, v) {
  const ks = path.split(".");
  let a = o;
  for (let n = 0; n < ks.length - 1; n++) {
    if (a[ks[n]] == null || typeof a[ks[n]] !== "object") a[ks[n]] = /^\d+$/.test(ks[n + 1]) ? [] : {};
    a = a[ks[n]];
  }
  a[ks[ks.length - 1]] = v;
  return o;
}
function modDoc(m, id) {
  if (m === "cards") return S.cards.get(id);
  if (m === "gm") return { text: S.gm.get(id) || "" };
  return S.mod[m] && S.mod[m].get(id);
}
function dkey(m, i, p) { return m + "|" + i + "|" + p; }
function val(m, i, p, dflt = "") {
  const k = dkey(m, i, p);
  if (S.drafts.has(k)) return S.drafts.get(k);
  const v = getPath(modDoc(m, i) || {}, p);
  return v == null || v === "" ? dflt : v;
}
function fid(m, i, p) { return ("f_" + m + "_" + i + "_" + p).replace(/[^\w-]/g, "_"); }
function bind(m, i, p) { return `id="${fid(m, i, p)}" data-m="${m}" data-i="${esc(i)}" data-p="${p}"`; }
function wrapLabel(label, o, control) {
  if (label == null) return control;
  return `<label class="mf${o.wide ? " wide" : ""}"><span>${label}${o.hint ? ` <span class="hint">${o.hint}</span>` : ""}</span>${control}</label>`;
}
function fInput(m, i, p, label, o = {}) {
  const v = val(m, i, p, o.dflt ?? "");
  return wrapLabel(label, o, `<input ${bind(m, i, p)} type="${o.type || "text"}" value="${esc(v)}" placeholder="${esc(o.ph || "")}"${o.min != null ? ` min="${o.min}"` : ""}${o.max != null ? ` max="${o.max}"` : ""}${o.aria ? ` aria-label="${esc(o.aria)}"` : ""}${o.cls ? ` class="${o.cls}"` : ""} ${S.canWrite ? "" : "readonly"}>`);
}
function fArea(m, i, p, label, o = {}) {
  return wrapLabel(label, o, `<textarea ${bind(m, i, p)} rows="${o.rows || 3}" placeholder="${esc(o.ph || "")}"${o.aria ? ` aria-label="${esc(o.aria)}"` : ""} ${S.canWrite ? "" : "readonly"}>${esc(val(m, i, p, ""))}</textarea>`);
}
function fSelect(m, i, p, label, opts, o = {}) {
  const v = String(val(m, i, p, o.dflt ?? ""));
  return wrapLabel(label, o, `<select ${bind(m, i, p)}${o.aria ? ` aria-label="${esc(o.aria)}"` : ""} ${S.canWrite ? "" : "disabled"}>${opts.map(([ov, ol]) => `<option value="${esc(ov)}" ${String(ov) === v ? "selected" : ""}>${esc(ol ?? ov)}</option>`).join("")}</select>`);
}
function fCheck(m, i, p, aria, cls = "") {
  return `<input type="checkbox" ${bind(m, i, p)} aria-label="${esc(aria)}" ${val(m, i, p, false) ? "checked" : ""} ${S.canWrite ? "" : "disabled"}${cls ? ` class="${cls}"` : ""}>`;
}

/* ----- saving ----- */
const saveTimers = new Map();
function commit(m, i, p, v) {
  if (m === "gm") {
    S.gm.set(i, v);
    if (S.db && S.canGM) R(P().gm + "/" + i).set({ text: v }).catch(handleWriteError);
    return;
  }
  if (m === "cards") {
    const c = S.cards.get(i); if (!c) return;
    const nc = setPath(structuredClone(c), p, v);
    nc.updated = new Date().toISOString();
    S.cards.set(i, nc);
    const top = p.split(".")[0];
    if (S.db) R(P().cards + "/" + i).update({ [top]: nc[top], updated: nc.updated }).catch(handleWriteError);
    return;
  }
  const d = structuredClone(S.mod[m].get(i) || { id: i });
  setPath(d, p, v);
  putDoc(m, i, d, false);
}
function putDoc(m, i, d, rerender = true) {
  d.id = i;
  S.mod[m].set(i, d);
  if (rerender) render();
  if (S.db) R(MP(m) + "/" + i).set(d).catch(handleWriteError);
}
function delDoc(m, i) {
  S.mod[m].delete(i); render();
  if (S.db) R(MP(m) + "/" + i).delete().catch(handleWriteError);
}
function docCopy(m, i) { return structuredClone(modDoc(m, i) || { id: i }); }
function flushAll() {
  for (const [k, t] of saveTimers) {
    clearTimeout(t);
    const [m, i, ...rest] = k.split("|");
    if (S.drafts.has(k)) commit(m, i, rest.join("|"), S.drafts.get(k));
    S.drafts.delete(k);
  }
  saveTimers.clear();
}
function readField(el) {
  if (el.type === "checkbox") return el.checked;
  if (el.type === "number") return el.value === "" ? "" : Number(el.value);
  return el.value;
}
document.addEventListener("input", e => {
  const q = e.target.closest("[data-q]");
  if (q) { if (q.dataset.q === "spell") S.spell.q = q.value; else S.modQ[q.dataset.q] = q.value; renderModule(); return; }
  const el = e.target.closest("[data-m]");
  if (!el || !S.canWrite || el.type === "checkbox" || el.tagName === "SELECT") return;
  const { m, i, p } = el.dataset, k = dkey(m, i, p), v = readField(el);
  S.drafts.set(k, v);
  clearTimeout(saveTimers.get(k));
  saveTimers.set(k, setTimeout(() => {
    saveTimers.delete(k);
    commit(m, i, p, v);
    if (S.drafts.get(k) === v) S.drafts.delete(k);
    if (S.tab !== "board") render();
  }, 500));
});
document.addEventListener("change", e => {
  const el = e.target.closest("[data-m]");
  if (el && S.canWrite) {
    const { m, i, p } = el.dataset, k = dkey(m, i, p);
    const isText = el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type !== "checkbox");
    if (isText && !saveTimers.has(k)) return;
    clearTimeout(saveTimers.get(k)); saveTimers.delete(k); S.drafts.delete(k);
    commit(m, i, p, readField(el));
    if (S.tab !== "board") render();
    return;
  }
  const ch = e.target.closest("[data-change]");
  if (ch && CHANGES[ch.dataset.change]) { flushAll(); CHANGES[ch.dataset.change](ch.dataset, ch); return; }
  const ts = e.target.closest("[data-tabshow]");
  if (ts) {
    const id = ts.dataset.tabshow;
    S.tabPrefs.hidden = ts.checked ? S.tabPrefs.hidden.filter(x => x !== id) : [...new Set([...S.tabPrefs.hidden, id])];
    lsSet("sb-tabs", S.tabPrefs); renderTabs(); render();
  }
});
document.addEventListener("keydown", e => {
  if (e.key !== "Enter") return;
  const map = { "stage-new": "stage-add", "run-name": "run-add", "run-init": "run-add", "run-hp": "run-add", "exp-name": "exp-add", "exp-who": "exp-add", "exp-days": "exp-add" };
  const act = map[e.target.id];
  if (act) { e.preventDefault(); const btn = document.querySelector(`[data-do="${act}"]`); if (btn) btn.click(); }
});

/* ----- shared bits of UI ----- */
function pickSel(mod, list, fallback) {
  let id = S.sel[mod];
  if (!list.some(x => x.id === id)) id = S.sel[mod] = fallback !== undefined ? fallback : (list[0]?.id || null);
  return id;
}
function listPane({ mod, title, items, sel, newDo, newLabel, empty, filters = "" }) {
  return `<aside class="mlist" aria-label="${esc(title)}">
    <div class="mlist-head"><h2>${title}</h2>${S.canWrite && newDo ? `<button type="button" class="btn primary small" data-do="${newDo}">${newLabel}</button>` : ""}</div>
    <div class="mfilters">${filters}</div>
    <div class="mlist-items" data-keep-scroll="list-${mod}">${items.length ? items.map(it => `<button type="button" class="mitem" data-do="select" data-mod="${mod}" data-id="${esc(it.id)}" aria-current="${it.id === sel}">
      <span class="mi-title${it.pin ? " mi-pin" : ""}">${esc(it.title)}</span>${it.badge || ""}${it.sub ? `<span class="mi-sub">${esc(it.sub)}</span>` : ""}</button>`).join("") : `<p class="mempty">${empty}</p>`}</div>
  </aside>`;
}
function emptyDetail(title, text, act, label) {
  return `<div class="mempty-detail"><h2>${title}</h2><p>${text}</p>${S.canWrite && act ? `<button type="button" class="btn primary" data-do="${act}">${label}</button>` : ""}</div>`;
}
function delBtn(key, id, label, act) {
  if (!S.canWrite) return "";
  if (S.confirm === key + id) return `<span class="confirm">Delete for good? <button type="button" class="btn danger" data-do="${act}" data-id="${esc(id)}">Delete</button><button type="button" class="btn" data-do="cancel">Keep</button></span>`;
  return `<button type="button" class="btn danger" data-do="ask" data-key="${esc(key + id)}">${label}</button>`;
}
function cardChip(c, extra = "", removeAttrs = "") {
  return `<span class="lchip"><button type="button" class="go" data-do="open-card" data-id="${esc(c.id)}">${esc(c.title || "Untitled")}</button><em>${extra || esc(KIND[c.kind]?.label || c.kind)}</em>${removeAttrs ? `<button type="button" class="x" ${removeAttrs} aria-label="Remove ${esc(c.title)}">×</button>` : ""}</span>`;
}
function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return isNaN(d) ? s : d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
async function newCardOf(kind, extra) {
  const c = { id: uid(), kind, title: "", body: "", act: "", status: "planned", tags: [], order: nextOrder(""), updated: new Date().toISOString(), ...extra };
  await saveCard(c);
  return c;
}
function focusField(m, i, p) {
  setTimeout(() => { const el = document.getElementById(fid(m, i, p)); if (el) { el.focus(); el.select?.(); } }, 30);
}

/* ===================== Sessions ===================== */
function sortedSessions() { return [...S.mod.sessions.values()].sort((a, b) => (Number(a.num) || 0) - (Number(b.num) || 0) || String(a.title || "").localeCompare(String(b.title || ""))); }
function renderSessions() {
  const list = sortedSessions();
  const id = pickSel("sessions", list);
  const items = list.map(s => ({
    id: s.id,
    title: `${s.num !== "" && s.num != null ? s.num + " · " : ""}${s.title || "Untitled session"}`,
    sub: [fmtDate(s.date), (s.scenes || []).length ? `${s.scenes.length} card${s.scenes.length === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · "),
    badge: s.status === "played" ? pill("Played", "played") : pill("Planned", "muted"),
  }));
  return `<div class="mod">${listPane({ mod: "sessions", title: "Sessions", items, sel: id, newDo: "new-session", newLabel: "+ Session", empty: "No sessions yet." })}
    ${id ? sessionDetail(S.mod.sessions.get(id)) : emptyDetail("Plan your next session", "Each session gets a strong start, the scenes you might run, secrets the players could find, and a recap afterwards.", "new-session", "+ Plan a session")}</div>`;
}
function sessionDetail(s) {
  const m = "sessions", i = s.id;
  const linked = (s.scenes || []).map(cid => S.cards.get(cid)).filter(Boolean);
  const linkable = [...S.cards.values()].filter(c => !(s.scenes || []).includes(c.id))
    .sort((a, b) => (a.kind === "scene" ? 0 : 1) - (b.kind === "scene" ? 0 : 1) || String(a.title).localeCompare(String(b.title)));
  return `<section class="mdetail" aria-label="Session">
    <div class="mgrid">
      ${fInput(m, i, "num", "Session", { type: "number", min: 0 })}
      ${fInput(m, i, "title", "Title", { ph: "Into the Staircase", wide: true })}
      ${fInput(m, i, "date", "Date", { type: "date" })}
      ${fSelect(m, i, "status", "Status", [["planned", "Planned"], ["played", "Played"]], { dflt: "planned" })}
    </div>
    ${fArea(m, i, "start", "Strong start", { hint: "How the session opens. Drop the players straight into something.", rows: 3 })}
    <div class="msec"><h3>Scenes &amp; cards</h3><p class="hint">Storyboard cards you might use this session, in rough order.</p>
      <div class="linkchips">${linked.map(c => cardChip(c, c.status === "played" ? "played" : "", S.canWrite ? `data-do="sess-unlink" data-id="${esc(i)}" data-cid="${esc(c.id)}"` : "")).join("") || `<span class="hint">None linked yet.</span>`}</div>
      ${S.canWrite && linkable.length ? `<select data-change="sess-link" data-id="${esc(i)}" aria-label="Link a storyboard card"><option value="">Link a card…</option>${linkable.map(c => `<option value="${esc(c.id)}">${esc(c.title || "Untitled")} (${esc(KIND[c.kind]?.label || c.kind)})</option>`).join("")}</select>` : ""}
    </div>
    ${fArea(m, i, "secrets", "Secrets & clues", { hint: "Things the players could discover. One per line.", rows: 5 })}
    ${fArea(m, i, "notes", "Prep notes", { rows: 4 })}
    ${fArea(m, i, "recap", "Recap", { hint: "What actually happened. Fill this in after the game.", rows: 5 })}
    <div class="md-foot">
      ${linked.length && S.canWrite ? `<button type="button" class="btn" data-do="sess-played" data-id="${esc(i)}">Mark these cards played</button>` : ""}
      <span class="spacer"></span>${delBtn("session", i, "Delete session", "del-session")}
    </div>
  </section>`;
}

/* ===================== Meta Plot ===================== */
const THREAD_KINDS = [["main", "Main plot"], ["side", "Side plot"], ["faction", "Faction"], ["villain", "Villain's plan"], ["mystery", "Mystery"]];
const THREAD_STATUS = [["active", "Active"], ["simmering", "Simmering"], ["resolved", "Resolved"]];
function sortedThreads() { return [...S.mod.plot.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.title || "").localeCompare(String(b.title || ""))); }
function threadProgress(t) { const st = t.stages || []; const done = st.filter(x => x.done).length; return { done, total: st.length, pct: st.length ? Math.round(done / st.length * 100) : 0 }; }
function renderPlot() {
  const list = sortedThreads();
  const id = pickSel("plot", [{ id: "__overview" }, ...list], "__overview");
  const label = Object.fromEntries(THREAD_KINDS), slabel = Object.fromEntries(THREAD_STATUS);
  const items = [{ id: "__overview", title: "Overview", sub: "Premise, the big secret, the endgame", pin: true }].concat(list.map(t => {
    const p = threadProgress(t);
    return { id: t.id, title: t.title || "Untitled thread", sub: `${label[t.kind] || "Thread"} · ${slabel[t.status] || "Active"}`, badge: p.total ? `<span class="mono hint">${p.done}/${p.total}</span>` : "" };
  }));
  return `<div class="mod">${listPane({ mod: "plot", title: "Meta Plot", items, sel: id, newDo: "new-thread", newLabel: "+ Thread", empty: "" })}
    ${id === "__overview" ? plotOverview(list) : threadDetail(S.mod.plot.get(id))}</div>`;
}
function plotOverview(list) {
  const m = "screen", i = "overview";
  const slabel = Object.fromEntries(THREAD_STATUS), tone = { active: "good", simmering: "warn", resolved: "played" };
  return `<section class="mdetail" aria-label="Overview">
    ${fArea(m, i, "premise", "The premise", { hint: "What this campaign is about, in a few lines.", rows: 4 })}
    <div class="gm-box">${fArea(m, i, "secret", "The big secret", { hint: "The truth at the heart of it all.", rows: 4 })}</div>
    <div class="mgrid">${fInput(m, i, "themes", "Themes", { ph: "Lost memory, false gods, loyalty", wide: true })}</div>
    ${fArea(m, i, "endgame", "How it could end", { rows: 3 })}
    <div class="msec"><div class="row-between"><h3>Threads at a glance</h3>${S.canWrite ? `<button type="button" class="btn small" data-do="new-thread">+ Thread</button>` : ""}</div>
      ${list.length ? `<div class="glance">${list.map(t => { const p = threadProgress(t); return `<button type="button" data-do="select" data-mod="plot" data-id="${esc(t.id)}"><b>${esc(t.title || "Untitled thread")}</b>${pill(slabel[t.status] || "Active", tone[t.status] || "good")}<div class="progress" role="progressbar" aria-label="${esc(t.title)} progress" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.pct}%"></span></div></button>`; }).join("")}</div>`
        : `<p class="hint">Threads are the storylines moving in the background: the main plot, villains' plans, factions, mysteries. Each has stages you tick off as it advances.</p>`}
    </div>
  </section>`;
}
function threadDetail(t) {
  const m = "plot", i = t.id, st = t.stages || [], p = threadProgress(t);
  return `<section class="mdetail" aria-label="Plot thread">
    <div class="mgrid">
      ${fInput(m, i, "title", "Thread", { ph: "The Cult of the Node", wide: true, cls: "big" })}
      ${fSelect(m, i, "kind", "Type", THREAD_KINDS, { dflt: "main" })}
      ${fSelect(m, i, "status", "Status", THREAD_STATUS, { dflt: "active" })}
    </div>
    ${fArea(m, i, "summary", "What the players know", { rows: 3 })}
    <div class="gm-box">${fArea(m, i, "truth", "What's really going on", { rows: 4 })}</div>
    <div class="msec"><div class="row-between"><h3>Stages</h3><span class="mono hint">${p.done} of ${p.total} done</span></div>
      <div class="progress" role="progressbar" aria-label="Thread progress" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100"><span style="width:${p.pct}%"></span></div>
      <div class="stages">${st.map((s, n) => `<div class="stage ${s.done ? "done" : ""}">
        ${fCheck(m, i, `stages.${n}.done`, `Stage ${n + 1} done`)}
        ${fInput(m, i, `stages.${n}.text`, null, { aria: `Stage ${n + 1}` })}
        ${S.canWrite ? `<span class="actions">
          <button type="button" class="icon-btn" data-do="stage-move" data-id="${esc(i)}" data-n="${n}" data-dir="-1" aria-label="Move stage up" ${n === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="icon-btn" data-do="stage-move" data-id="${esc(i)}" data-n="${n}" data-dir="1" aria-label="Move stage down" ${n === st.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="icon-btn" data-do="stage-del" data-id="${esc(i)}" data-n="${n}" aria-label="Remove stage">×</button></span>` : ""}
      </div>`).join("")}</div>
      ${S.canWrite ? `<div class="add-row"><input id="stage-new" placeholder="Next step, e.g. The cult moves the node to the capital" aria-label="New stage"><button type="button" class="btn" data-do="stage-add" data-id="${esc(i)}">Add stage</button></div>` : ""}
    </div>
    ${fArea(m, i, "ifIgnored", "If the players do nothing", { hint: "What happens next on its own.", rows: 3 })}
    <div class="md-foot"><span class="spacer"></span>${delBtn("thread", i, "Delete thread", "del-thread")}</div>
  </section>`;
}

/* ===================== NPCs ===================== */
const ATTITUDE_TONE = { Friendly: "good", Indifferent: "muted", Hostile: "bad" };
function renderNpcs() {
  const towns = cardsOf("town");
  const q = (S.modQ.npcs || "").trim().toLowerCase(), tf = S.modQ.npcTown;
  const all = cardsOf("npc");
  const list = all.filter(c => (!tf || c.town === tf) && (!q || [c.title, c.role, c.body, c.voice, c.wants].join(" ").toLowerCase().includes(q)));
  const id = pickSel("npcs", list);
  const items = list.map(c => ({
    id: c.id, title: c.title || "Unnamed NPC",
    sub: [c.role, S.cards.get(c.town)?.title].filter(Boolean).join(" · "),
    badge: c.life && c.life !== "Alive" ? pill(c.life, "bad") : pill(c.attitude || "Indifferent", ATTITUDE_TONE[c.attitude || "Indifferent"]),
  }));
  const filters = all.length ? `<input id="npc-q" type="search" data-q="npcs" placeholder="Search NPCs" aria-label="Search NPCs" value="${esc(S.modQ.npcs)}">
    ${towns.length ? `<select data-change="npc-town" aria-label="Filter by town"><option value="">All towns</option>${towns.map(t => `<option value="${esc(t.id)}" ${t.id === tf ? "selected" : ""}>${esc(t.title || "Untitled town")}</option>`).join("")}</select>` : ""}` : "";
  return `<div class="mod">${listPane({ mod: "npcs", title: "NPCs", items, sel: id, newDo: "new-npc", newLabel: "+ NPC", empty: all.length ? "No NPCs match." : "No NPCs yet.", filters })}
    ${id ? npcDetail(S.cards.get(id)) : emptyDetail("Your cast", "Every NPC here is also a card on your storyboard. Give them a role, a town, a voice and the secrets they keep.", "new-npc", "+ Add an NPC")}</div>`;
}
function connections(c) {
  const out = (c.links || []).map(l => ({ c: S.cards.get(l.to), label: l.label })).filter(x => x.c);
  const inn = [...S.cards.values()].flatMap(o => (o.links || []).filter(l => l.to === c.id).map(l => ({ c: o, label: l.label ? "← " + l.label : "←" })));
  const sess = sortedSessions().filter(s => (s.scenes || []).includes(c.id));
  if (!out.length && !inn.length && !sess.length) return "";
  return `<div class="msec"><h3>Connections</h3><div class="linkchips">
    ${out.map(x => cardChip(x.c, esc(x.label ? x.label + " →" : "→"))).join("")}
    ${inn.map(x => cardChip(x.c, esc(x.label))).join("")}
    ${S.canGM ? sess.map(s => `<span class="lchip"><button type="button" class="go" data-do="goto" data-tab="sessions" data-id="${esc(s.id)}">${esc(s.title || "Session " + (s.num ?? ""))}</button><em>session</em></span>`).join("") : ""}
  </div></div>`;
}
function npcDetail(c) {
  const m = "cards", i = c.id;
  const towns = cardsOf("town");
  return `<section class="mdetail" aria-label="NPC">
    <div class="md-top">${typeof portraitBlock === "function" ? portraitBlock(c) : ""}
      <div class="mgrid">
        ${fInput(m, i, "title", "Name", { wide: true, cls: "big" })}
        ${fInput(m, i, "role", "Role", { ph: "Innkeeper, cult leader…" })}
        ${fSelect(m, i, "town", "Town", [["", "—"], ...towns.map(t => [t.id, t.title || "Untitled town"])])}
        ${fSelect(m, i, "attitude", "Attitude", [["Friendly"], ["Indifferent"], ["Hostile"]], { dflt: "Indifferent" })}
        ${fSelect(m, i, "life", "Status", [["Alive"], ["Dead"], ["Missing"], ["Unknown"]], { dflt: "Alive" })}
      </div>
    </div>
    ${fArea(m, i, "body", "Appearance & description", { rows: 4 })}
    ${fArea(m, i, "voice", "Voice & mannerisms", { rows: 2, ph: "Gravelly whisper, taps the table when lying" })}
    ${fArea(m, i, "wants", "Wants & fears", { rows: 2 })}
    ${S.canGM ? `<div class="gm-box">${fArea("gm", i, "text", "Secrets", { hint: "Only you see these. Same as the card's GM notes.", rows: 3 })}</div>` : ""}
    ${typeof npcStatSection === "function" ? npcStatSection(c) : ""}
    ${connections(c)}
    <div class="md-foot"><button type="button" class="btn" data-do="open-card" data-id="${esc(i)}">Open on storyboard</button><span class="spacer"></span>${delBtn("card", i, "Delete NPC", "del-card")}</div>
  </section>`;
}

/* ===================== Towns ===================== */
const TOWN_SIZES = [["Hamlet"], ["Village"], ["Town"], ["City"], ["Metropolis"]];
function renderTowns() {
  const all = cardsOf("town"), npcs = cardsOf("npc");
  const q = (S.modQ.towns || "").trim().toLowerCase();
  const list = all.filter(c => !q || [c.title, c.body, c.ruler, c.places].join(" ").toLowerCase().includes(q));
  const id = pickSel("towns", list);
  const items = list.map(c => {
    const n = npcs.filter(x => x.town === c.id).length;
    return { id: c.id, title: c.title || "Untitled town", sub: [c.size, c.population ? `pop. ${c.population}` : ""].filter(Boolean).join(" · "), badge: n ? `<span class="mono hint">${n} NPC${n === 1 ? "" : "s"}</span>` : "" };
  });
  const filters = all.length > 6 ? `<input id="town-q" type="search" data-q="towns" placeholder="Search towns" aria-label="Search towns" value="${esc(S.modQ.towns)}">` : "";
  return `<div class="mod">${listPane({ mod: "towns", title: "Towns", items, sel: id, newDo: "new-town", newLabel: "+ Town", empty: all.length ? "No towns match." : "No towns yet.", filters })}
    ${id ? townDetail(S.cards.get(id)) : emptyDetail("Towns & cities", "Record who runs each place, what's worth visiting, the rumours on the street, and who lives there. Towns also appear as cards on your storyboard.", "new-town", "+ Add a town")}</div>`;
}
function townDetail(c) {
  const m = "cards", i = c.id;
  const people = cardsOf("npc").filter(x => x.town === i);
  return `<section class="mdetail" aria-label="Town">
    <div class="md-top">${c.imageId ? `<img class="md-img" src="${blobUrl(c.imageId)}" alt="">` : ""}
      <div class="mgrid">
        ${fInput(m, i, "title", "Name", { wide: true, cls: "big" })}
        ${fSelect(m, i, "size", "Size", TOWN_SIZES, { dflt: "Village" })}
        ${fInput(m, i, "population", "Population", { ph: "About 300" })}
        ${fInput(m, i, "ruler", "Ruler or leader", { ph: "Mayor Bram Holt" })}
      </div>
    </div>
    ${fArea(m, i, "body", "Description", { rows: 4, ph: "What travellers see, hear and smell when they arrive." })}
    ${fArea(m, i, "places", "Notable places", { hint: "One per line.", rows: 4, ph: "The Drowned Lantern: tavern, run by a retired sailor" })}
    ${fArea(m, i, "rumors", "Rumours & hooks", { hint: "One per line.", rows: 3 })}
    ${S.canGM ? `<div class="gm-box">${fArea("gm", i, "text", "Secrets", { hint: "Only you see these. Same as the card's GM notes.", rows: 3 })}</div>` : ""}
    <div class="msec"><div class="row-between"><h3>People here</h3>${S.canWrite ? `<button type="button" class="btn small" data-do="npc-here" data-id="${esc(i)}">+ Add an NPC here</button>` : ""}</div>
      <div class="linkchips">${people.map(p => `<span class="lchip"><button type="button" class="go" data-do="goto" data-tab="npcs" data-id="${esc(p.id)}">${esc(p.title || "Unnamed NPC")}</button><em>${esc(p.role || "NPC")}</em></span>`).join("") || `<span class="hint">No NPCs placed here yet. Set an NPC's town on the NPCs tab.</span>`}</div>
    </div>
    ${connections(c)}
    <div class="md-foot"><button type="button" class="btn" data-do="open-card" data-id="${esc(i)}">Open on storyboard</button><span class="spacer"></span>${delBtn("card", i, "Delete town", "del-card")}</div>
  </section>`;
}

/* ===================== Combats ===================== */
const CRS = ["0", "1/8", "1/4", "1/2", ...Array.from({ length: 30 }, (_, k) => String(k + 1))];
const CR_XP = { "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000, "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000, "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000 };
const XP_BUDGET = { 1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100], 6: [600, 1000, 1400], 7: [750, 1300, 1700], 8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100], 11: [1900, 2900, 4100], 12: [2200, 3700, 4700], 13: [2600, 4200, 5400], 14: [2900, 4900, 6200], 15: [3300, 5400, 7800], 16: [3800, 6100, 9800], 17: [4500, 7200, 11700], 18: [5000, 8700, 14200], 19: [5500, 10700, 17200], 20: [6400, 13200, 22000] };
const CONDITIONS = ["Blinded", "Charmed", "Concentrating", "Deafened", "Exhaustion", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious"];
const fmtN = n => Number(n || 0).toLocaleString();
function guildParty() {
  const g = S.mod.screen.get("guild") || {};
  return (g.party || []).filter(p => p && (p.char || p.player));
}
function partyDefaults() {
  const party = guildParty();
  const lvls = party.map(p => int(p.lvl)).filter(Boolean);
  return { partySize: party.length || 4, partyLevel: lvls.length ? clamp(Math.round(lvls.reduce((a, b) => a + b, 0) / lvls.length), 1, 20) : 1 };
}
function encStats(c) {
  const size = clamp(int(c.partySize), 0, 12), lvl = clamp(int(c.partyLevel) || 1, 1, 20);
  const b = XP_BUDGET[lvl].map(x => x * size);
  const total = (c.monsters || []).reduce((s, mo) => s + (CR_XP[mo.cr] ?? 0) * Math.max(0, int(mo.count)), 0);
  const label = !total ? "No monsters yet" : !size ? "Add the party size" : total <= b[0] ? "Low" : total <= b[1] ? "Moderate" : total <= b[2] ? "High" : "Beyond High";
  const tone = { Low: "good", Moderate: "warn", High: "bad", "Beyond High": "bad" }[label] || "muted";
  return { size, lvl, b, total, label, tone };
}
function sortedCombats() { return [...S.mod.combats.values()].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0) || String(b.created || "").localeCompare(String(a.created || ""))); }
function renderCombats() {
  const list = sortedCombats();
  const id = pickSel("combats", list);
  const items = list.map(c => {
    const st = encStats(c);
    return { id: c.id, title: c.title || "Untitled encounter", sub: st.total ? `${st.label} · ${fmtN(st.total)} XP` : st.label, badge: c.run ? pill("Running", "warn") : c.status === "done" ? pill("Fought", "played") : "" };
  });
  return `<div class="mod">${listPane({ mod: "combats", title: "Combats", items, sel: id, newDo: "new-combat", newLabel: "+ Encounter", empty: "No encounters yet." })}
    ${id ? combatDetail(S.mod.combats.get(id)) : emptyDetail("Build an encounter", "Add monsters and see how hard the fight is for your party using the 2024 XP budgets, then run it with the initiative tracker.", "new-combat", "+ Build an encounter")}</div>`;
}
function combatDetail(c) {
  const m = "combats", i = c.id, st = encStats(c), mons = c.monsters || [];
  const scale = Math.max(st.b[2] * 1.25, st.total, 1);
  const pos = v => clamp(v / scale * 100, 0, 100).toFixed(1);
  return `<section class="mdetail" aria-label="Encounter">
    <div class="mgrid">
      ${fInput(m, i, "title", "Encounter", { wide: true, cls: "big", ph: "Ambush at the Fifth Landing" })}
      ${fInput(m, i, "where", "Where", { ph: "The Sunken Library" })}
      ${fSelect(m, i, "status", "Status", [["prep", "Planned"], ["done", "Fought"]], { dflt: "prep" })}
    </div>
    <div class="msec"><h3>Party</h3>
      <div class="mgrid">${fInput(m, i, "partySize", "Characters", { type: "number", min: 1, max: 12 })}${fInput(m, i, "partyLevel", "Average level", { type: "number", min: 1, max: 20 })}</div>
      <div class="budget"><div><span>Low</span><b>${fmtN(st.b[0])}</b></div><div><span>Moderate</span><b>${fmtN(st.b[1])}</b></div><div><span>High</span><b>${fmtN(st.b[2])}</b></div></div>
    </div>
    <div class="msec"><h3>Monsters</h3>
      ${mons.length ? `<div class="mtable-wrap"><table class="mt monsters"><thead><tr><th>Monster</th><th>CR</th><th class="num">Count</th><th class="num">AC</th><th class="num">HP</th><th class="num">XP</th><th><span class="sr-only">Remove</span></th></tr></thead><tbody>
        ${mons.map((mo, n) => `<tr>
          <td>${fInput(m, i, `monsters.${n}.name`, null, { aria: `Monster ${n + 1} name`, ph: "Goblin" })}</td>
          <td style="width:84px">${fSelect(m, i, `monsters.${n}.cr`, null, CRS.map(x => [x]), { aria: `Monster ${n + 1} CR`, dflt: "1" })}</td>
          <td class="num" style="width:72px">${fInput(m, i, `monsters.${n}.count`, null, { type: "number", min: 0, aria: `Monster ${n + 1} count` })}</td>
          <td class="num" style="width:64px">${fInput(m, i, `monsters.${n}.ac`, null, { type: "number", aria: `Monster ${n + 1} AC` })}</td>
          <td class="num" style="width:72px">${fInput(m, i, `monsters.${n}.hp`, null, { type: "number", aria: `Monster ${n + 1} HP` })}</td>
          <td class="num mono" style="width:80px">${fmtN((CR_XP[mo.cr] ?? 0) * Math.max(0, int(mo.count)))}</td>
          <td style="width:76px"><span class="actions" style="flex-wrap:nowrap;gap:4px">${mo.srd ? `<button type="button" class="icon-btn" data-do="goto" data-tab="bestiary" data-id="${esc(mo.srd)}" aria-label="Stat block for ${esc(mo.name)}" title="Stat block">i</button>` : mo.npc ? `<button type="button" class="icon-btn" data-do="goto" data-tab="npcs" data-id="${esc(mo.npc)}" aria-label="NPC page for ${esc(mo.name)}" title="NPC stat block">i</button>` : ""}${S.canWrite ? `<button type="button" class="icon-btn" data-do="mon-del" data-id="${esc(i)}" data-n="${n}" aria-label="Remove monster">×</button>` : ""}</span></td>
        </tr>`).join("")}</tbody></table></div>` : `<p class="hint">No monsters yet.</p>`}
      ${S.canWrite ? `<div class="add-row"><input id="best-add-${esc(i)}" list="srd-monster-list" data-change="best-add" data-id="${esc(i)}" placeholder="Add from the Bestiary: type a creature name" aria-label="Add a creature from the Bestiary"><button type="button" class="btn" data-do="mon-add" data-id="${esc(i)}">+ Blank row</button></div>` : ""}
      <div class="diffrow"><div class="diff ${st.tone}">${st.label}</div><div class="mono hint">${fmtN(st.total)} XP${st.size ? ` · High budget ${fmtN(st.b[2])}` : ""}</div></div>
      <div class="meter" role="img" aria-label="${esc(`${st.label}: ${st.total} XP against budgets of ${st.b.join(", ")}`)}">
        <div class="fill ${st.tone}" style="width:${pos(st.total)}%"></div>
        <div class="mark" style="left:${pos(st.b[0])}%"><span>Low</span></div><div class="mark" style="left:${pos(st.b[1])}%"><span>Mod</span></div><div class="mark" style="left:${pos(st.b[2])}%"><span>High</span></div>
      </div>
    </div>
    <div class="mgrid">${fArea(m, i, "tactics", "Tactics", { rows: 3, ph: "How the monsters fight, and when they flee" })}${fArea(m, i, "loot", "Loot & rewards", { rows: 3 })}</div>
    ${tracker(c)}
    <div class="md-foot"><span class="spacer"></span>${delBtn("combat", i, "Delete encounter", "del-combat")}</div>
  </section>`;
}
function sortedRun(list) {
  return (list || []).map((x, n) => ({ ...x, n })).sort((a, b) => {
    const ai = a.init === "" || a.init == null ? -999 : Number(a.init), bi = b.init === "" || b.init == null ? -999 : Number(b.init);
    return bi - ai || (b.pc ? 1 : 0) - (a.pc ? 1 : 0) || String(a.name).localeCompare(String(b.name));
  });
}
function tracker(c) {
  const m = "combats", i = c.id;
  if (!c.run) {
    const party = guildParty().length;
    return `<div class="msec"><h3>Initiative</h3>
      <p class="hint">${party ? `Starting adds your ${party} party member${party === 1 ? "" : "s"} from the Guild tracker on the DM Screen, plus every monster above.` : "Starting adds every monster above. Fill in the party on the DM Screen's Guild tracker and they'll be added too."}</p>
      ${S.canWrite ? `<div><button type="button" class="btn primary" data-do="run-start" data-id="${esc(i)}">Start combat</button></div>` : ""}</div>`;
  }
  const run = c.run, order = sortedRun(run.list);
  return `<div class="msec"><h3>Initiative</h3>
    <div class="tracker-head">
      <span class="round">Round ${run.round || 1}</span>
      ${S.canWrite ? `<button type="button" class="btn" data-do="run-roll" data-id="${esc(i)}">Roll monster initiative</button>
      <button type="button" class="btn" data-do="run-prev" data-id="${esc(i)}">Previous</button>
      <button type="button" class="btn primary" data-do="run-next" data-id="${esc(i)}">Next turn</button>` : ""}
    </div>
    <div class="tracker">${order.map(x => {
      const active = x.id === run.active, down = x.hp !== "" && x.hp != null && Number(x.hp) <= 0;
      return `<div class="init-row ${active ? "active" : ""} ${down ? "down" : ""}" id="row-${esc(x.id)}">
        ${fInput(m, i, `run.list.${x.n}.init`, null, { type: "number", aria: `Initiative for ${x.name}`, ph: "Init" })}
        <div class="nm">${active ? `<span class="turn-tag">Turn</span>` : ""}<b>${esc(x.name)}</b>${x.pc ? pill("PC", "muted") : ""}<span class="hint">AC ${esc(x.ac || "—")}</span></div>
        <div class="hp">${fInput(m, i, `run.list.${x.n}.hp`, null, { type: "number", aria: `Hit points for ${x.name}`, ph: "HP" })}<span class="hint">/ ${esc(x.max || "—")}</span></div>
        <div class="conds">${(x.cond || []).map((cd, k) => `<span class="cchip">${esc(cd)}<button type="button" data-do="cond-del" data-id="${esc(i)}" data-n="${x.n}" data-k="${k}" aria-label="Remove ${esc(cd)} from ${esc(x.name)}">×</button></span>`).join("")}
          ${S.canWrite ? `<select data-change="cond-add" data-id="${esc(i)}" data-n="${x.n}" aria-label="Add a condition to ${esc(x.name)}"><option value="">+ Condition</option>${CONDITIONS.filter(cd => !(x.cond || []).includes(cd)).map(cd => `<option>${cd}</option>`).join("")}</select>` : ""}</div>
        ${S.canWrite ? `<button type="button" class="icon-btn" data-do="run-del" data-id="${esc(i)}" data-n="${x.n}" aria-label="Remove ${esc(x.name)}">×</button>` : ""}
      </div>`;
    }).join("")}</div>
    ${S.canWrite ? `<div class="add-row"><input id="run-name" placeholder="Add someone: name" aria-label="Combatant name"><input id="run-init" class="short" type="number" placeholder="Init" aria-label="Initiative"><input id="run-hp" class="short" type="number" placeholder="HP" aria-label="Hit points"><button type="button" class="btn" data-do="run-add" data-id="${esc(i)}">Add</button></div>
    <div class="actions">${S.confirm === "end" + i ? `<span class="confirm">End this combat? <button type="button" class="btn danger" data-do="run-end" data-id="${esc(i)}">End combat</button><button type="button" class="btn" data-do="cancel">Keep going</button></span>` : `<button type="button" class="btn" data-do="ask" data-key="end${esc(i)}">End combat</button>`}</div>` : ""}
  </div>`;
}

/* ===================== actions ===================== */
function selectAndRender(mod, id) { S.sel[mod] = id; S.confirm = null; render(); }
const ACTIONS = {
  "select": d => selectAndRender(d.mod, d.id),
  "cancel": () => { S.confirm = null; render(); },
  "ask": d => { S.confirm = d.key; render(); },
  "tabs-arrange": () => { renderTabSheet(); openSheet("#tabs-sheet"); },
  "tab-move": d => {
    const order = tabOrder().slice(1), n = order.indexOf(d.id), j = n + Number(d.dir);
    if (n < 0 || j < 0 || j >= order.length) return;
    [order[n], order[j]] = [order[j], order[n]];
    S.tabPrefs.order = order; lsSet("sb-tabs", S.tabPrefs); renderTabSheet(); renderTabs();
  },
  "open-card": d => { setTab("board"); openEditor(d.id); },
  "goto": d => { S.sel[d.tab] = d.id; setTab(d.tab); },
  // sessions
  "new-session": () => {
    const list = sortedSessions();
    const num = list.length ? Math.max(...list.map(s => Number(s.num) || 0)) + 1 : 1;
    const id = uid();
    S.sel.sessions = id;
    putDoc("sessions", id, { title: "", num, date: "", status: "planned", scenes: [], start: "", secrets: "", notes: "", recap: "", created: new Date().toISOString() });
    focusField("sessions", id, "title");
  },
  "del-session": d => { S.confirm = null; delDoc("sessions", d.id); toast("Session deleted"); },
  "sess-unlink": d => { const s = docCopy("sessions", d.id); s.scenes = (s.scenes || []).filter(x => x !== d.cid); putDoc("sessions", d.id, s); },
  "sess-played": d => {
    const s = S.mod.sessions.get(d.id); let n = 0;
    for (const cid of s.scenes || []) { const c = S.cards.get(cid); if (c && c.status !== "played") { commit("cards", cid, "status", "played"); n++; } }
    render(); toast(n ? `Marked ${n} card${n === 1 ? "" : "s"} played` : "Those cards were already played");
  },
  // plot
  "new-thread": () => {
    const id = uid(), order = S.mod.plot.size ? Math.max(...[...S.mod.plot.values()].map(t => t.order ?? 0)) + 1 : 0;
    S.sel.plot = id;
    putDoc("plot", id, { title: "", kind: "main", status: "active", summary: "", truth: "", stages: [], ifIgnored: "", order });
    focusField("plot", id, "title");
  },
  "del-thread": d => { S.confirm = null; delDoc("plot", d.id); toast("Thread deleted"); },
  "stage-add": d => {
    const inp = $("#stage-new"); const text = (inp?.value || "").trim(); if (!text) { inp?.focus(); return; }
    const t = docCopy("plot", d.id); t.stages = [...(t.stages || []), { text, done: false }]; putDoc("plot", d.id, t);
    setTimeout(() => $("#stage-new")?.focus(), 30);
  },
  "stage-del": d => { const t = docCopy("plot", d.id); t.stages.splice(Number(d.n), 1); putDoc("plot", d.id, t); },
  "stage-move": d => {
    const t = docCopy("plot", d.id), n = Number(d.n), j = n + Number(d.dir);
    if (j < 0 || j >= t.stages.length) return;
    [t.stages[n], t.stages[j]] = [t.stages[j], t.stages[n]]; putDoc("plot", d.id, t);
  },
  // npcs & towns
  "new-npc": async () => { const c = await newCardOf("npc", { title: "New NPC", attitude: "Indifferent", life: "Alive", town: S.modQ.npcTown || "" }); selectAndRender("npcs", c.id); focusField("cards", c.id, "title"); },
  "npc-here": async d => { const c = await newCardOf("npc", { title: "New NPC", attitude: "Indifferent", life: "Alive", town: d.id }); S.sel.npcs = c.id; setTab("npcs"); focusField("cards", c.id, "title"); },
  "new-town": async () => { const c = await newCardOf("town", { title: "New town", size: "Village" }); selectAndRender("towns", c.id); focusField("cards", c.id, "title"); },
  "del-card": d => {
    S.confirm = null;
    const id = d.id, name = S.cards.get(id)?.title || "Card";
    deleteCard(id);
    for (const c of S.cards.values()) if ((c.links || []).some(l => l.to === id)) saveCard({ ...c, links: c.links.filter(l => l.to !== id) });
    toast(`Deleted “${name}”`);
  },
  // combats
  "new-combat": () => {
    const id = uid(); S.sel.combats = id;
    putDoc("combats", id, { title: "", where: "", status: "prep", ...partyDefaults(), monsters: [{ name: "", cr: "1", count: 1, ac: "", hp: "" }], tactics: "", loot: "", run: null, created: new Date().toISOString() });
    focusField("combats", id, "title");
  },
  "del-combat": d => { S.confirm = null; delDoc("combats", d.id); toast("Encounter deleted"); },
  "mon-add": d => {
    const c = docCopy("combats", d.id); const last = (c.monsters || []).slice(-1)[0];
    c.monsters = [...(c.monsters || []), { name: "", cr: last?.cr || "1", count: 1, ac: "", hp: "" }]; putDoc("combats", d.id, c);
    focusField("combats", d.id, `monsters.${c.monsters.length - 1}.name`);
  },
  "mon-del": d => { const c = docCopy("combats", d.id); c.monsters.splice(Number(d.n), 1); putDoc("combats", d.id, c); },
  "run-start": d => {
    const c = docCopy("combats", d.id);
    const list = guildParty().map(p => ({ id: uid(), name: p.char || p.player, pc: true, init: "", hp: p.hp === "" || p.hp == null ? "" : Number(p.hp), max: p.hp || "", ac: p.ac || "", cond: [] }));
    for (const mo of c.monsters || []) {
      const n = Math.max(0, int(mo.count));
      for (let k = 0; k < n; k++) list.push({ id: uid(), name: (mo.name || "Monster") + (n > 1 ? " " + (k + 1) : ""), pc: false, init: "", hp: mo.hp === "" || mo.hp == null ? "" : Number(mo.hp), max: mo.hp || "", ac: mo.ac || "", cond: [] });
    }
    if (!list.length) { toast("Add a monster or fill in the party first"); return; }
    c.run = { round: 1, active: sortedRun(list)[0].id, list };
    putDoc("combats", d.id, c);
  },
  "run-next": d => {
    const c = docCopy("combats", d.id), order = sortedRun(c.run.list); if (!order.length) return;
    let n = order.findIndex(x => x.id === c.run.active) + 1;
    if (n >= order.length) { n = 0; c.run.round = (c.run.round || 1) + 1; }
    c.run.active = order[n].id; putDoc("combats", d.id, c);
  },
  "run-prev": d => {
    const c = docCopy("combats", d.id), order = sortedRun(c.run.list); if (!order.length) return;
    let n = order.findIndex(x => x.id === c.run.active) - 1;
    if (n < 0) { if ((c.run.round || 1) <= 1) n = 0; else { n = order.length - 1; c.run.round -= 1; } }
    c.run.active = order[n].id; putDoc("combats", d.id, c);
  },
  "run-roll": d => {
    const c = docCopy("combats", d.id); let n = 0;
    for (const x of c.run.list) if (!x.pc && (x.init === "" || x.init == null)) { x.init = 1 + Math.floor(Math.random() * 20); n++; }
    putDoc("combats", d.id, c);
    toast(n ? `Rolled a d20 for ${n} monster${n === 1 ? "" : "s"}. Add Dex bonuses by hand.` : "Every monster already has initiative");
  },
  "run-del": d => {
    const c = docCopy("combats", d.id), gone = c.run.list[Number(d.n)];
    if (gone && gone.id === c.run.active) { const order = sortedRun(c.run.list); const k = order.findIndex(x => x.id === gone.id); c.run.active = order[(k + 1) % order.length]?.id || null; }
    c.run.list.splice(Number(d.n), 1); putDoc("combats", d.id, c);
  },
  "run-add": d => {
    const name = ($("#run-name")?.value || "").trim(); if (!name) { $("#run-name")?.focus(); return; }
    const init = $("#run-init").value, hp = $("#run-hp").value;
    const c = docCopy("combats", d.id);
    c.run.list.push({ id: uid(), name, pc: false, init: init === "" ? "" : Number(init), hp: hp === "" ? "" : Number(hp), max: hp, ac: "", cond: [] });
    putDoc("combats", d.id, c); setTimeout(() => $("#run-name")?.focus(), 30);
  },
  "run-end": d => { S.confirm = null; const c = docCopy("combats", d.id); c.run = null; c.status = "done"; putDoc("combats", d.id, c); toast("Combat ended"); },
  "cond-del": d => { const c = docCopy("combats", d.id); c.run.list[Number(d.n)].cond.splice(Number(d.k), 1); putDoc("combats", d.id, c); },
  // DM screen
  "screen-toggle": d => { S.screenOff = S.screenOff.includes(d.id) ? S.screenOff.filter(x => x !== d.id) : [...S.screenOff, d.id]; lsSet("sb-screen-off", S.screenOff); renderModule(); },
  "spell-lvl": d => { S.spell.lvl = d.lvl === "all" ? "all" : Number(d.lvl); renderModule(); },
  "favor": d => {
    if (!S.canWrite) return;
    const n = Number(d.n), cur = int(val("screen", "guild", "favor", 0));
    commit("screen", "guild", "favor", cur === n ? n - 1 : n); render();
  },
};
const CHANGES = {
  "sess-link": (d, el) => { if (!el.value) return; const s = docCopy("sessions", d.id); s.scenes = [...(s.scenes || []), el.value]; putDoc("sessions", d.id, s); },
  "npc-town": (d, el) => { S.modQ.npcTown = el.value; renderModule(); },
  "cond-add": (d, el) => { if (!el.value) return; const c = docCopy("combats", d.id); const x = c.run.list[Number(d.n)]; x.cond = [...(x.cond || []), el.value]; putDoc("combats", d.id, c); },
};
document.addEventListener("click", e => {
  const t = e.target.closest("[data-tab]:not([data-do])");
  if (t) { setTab(t.dataset.tab); return; }
  const b = e.target.closest("[data-do]");
  if (!b || b.disabled) return;
  const fn = ACTIONS[b.dataset.do];
  if (fn) { e.preventDefault(); flushAll(); fn(b.dataset, b); }
});

/* ----- copying, deleting and backing up module data with a campaign ----- */
async function copyModules(toBoard, idMap) {
  if (!S.canGM || !S.db) return;
  for (const coll of MOD_COLLS) for (const d of S.mod[coll].values()) {
    const nd = structuredClone(d);
    if (coll === "sessions") nd.scenes = (nd.scenes || []).filter(x => idMap.has(x)).map(x => idMap.get(x));
    await W(S.db.doc(MP(coll, toBoard) + "/" + d.id).set(nd));
  }
}
async function deleteModules(b) {
  for (const coll of MOD_COLLS) {
    const snap = await S.db.collection(MP(coll, b)).get();
    for (const d of snap.docs) await W(S.db.doc(MP(coll, b) + "/" + d.id).delete());
  }
}
function modulesForBackup() {
  if (!S.canGM) return {};
  return Object.fromEntries(MOD_COLLS.map(coll => [coll, [...S.mod[coll].values()].map(d => structuredClone(d))]));
}
async function restoreModules(mods) {
  if (!mods || !S.canGM || !S.db) return 0;
  let n = 0;
  for (const coll of MOD_COLLS) for (const d of Array.isArray(mods[coll]) ? mods[coll] : []) {
    if (!d || typeof d.id !== "string" || !d.id) continue;
    const id = d.id.replace(/[^\w.~:@+-]/g, "_").slice(0, 120);
    S.mod[coll].set(id, { ...d, id });
    await R(MP(coll) + "/" + id).set({ ...d, id }); n++;
  }
  return n;
}
