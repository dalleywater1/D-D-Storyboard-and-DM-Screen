/* ===================== Historical Timeline =====================
   Events and eras of your world's history, per campaign (gmx/<board>/timeline).
   Each event has what people believe and (GM only) what really happened, can be
   hidden from the players' view, and links to storyboard cards. Eras are spans
   of years drawn as coloured bands. An overview strip shows the whole span. */
MOD_COLLS.push("timeline");
MODULES.splice(MODULES.findIndex(m => m.id === "plot") + 1, 0, { id: "timeline", label: "Timeline", gm: true, render: () => renderTimeline() });
const TL_CATS = [["", "—"], ["founding", "Founding"], ["war", "War"], ["battle", "Battle"], ["treaty", "Treaty"], ["betrayal", "Betrayal"], ["death", "Death"], ["birth", "Birth"],
  ["rule", "Rise / fall of a ruler"], ["catastrophe", "Catastrophe"], ["discovery", "Discovery"], ["magic", "Magic / divine"], ["mystery", "Mystery"], ["party", "The party"], ["other", "Other"]];
const TL_CAT_COLOR = { war: "red", battle: "red", betrayal: "violet", death: "slate", birth: "green", founding: "teal", treaty: "blue", rule: "amber", catastrophe: "amber", discovery: "teal", magic: "violet", mystery: "violet", party: "green" };
S.tl = { q: "", cat: "", view: "gm", scrollTo: null };
const tlDocs = () => [...((S.mod && S.mod.timeline) || new Map()).values()];
const tlSettings = () => (S.mod.timeline && S.mod.timeline.get("_settings")) || {};
const tlEras = () => tlDocs().filter(d => d.type === "era").sort((a, b) => num(a.from) - num(b.from) || String(a.title).localeCompare(String(b.title)));
const tlEvents = () => tlDocs().filter(d => d.type === "event").sort((a, b) => num(a.year) - num(b.year) || num(a.order) - num(b.order) || String(a.created || "").localeCompare(String(b.created || "")));
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
const hasYear = v => v !== "" && v != null && Number.isFinite(Number(v));
function tlYear(y) {
  if (!hasYear(y)) return "—";
  const n = Number(y), suf = (tlSettings().suffix || "").trim();
  return (n < 0 ? "−" + Math.abs(n) : String(n)) + (suf ? " " + suf : "");
}
function tlEraOf(ev, eras) {
  if (ev.era) return eras.find(e => e.id === ev.era) || null;
  if (!hasYear(ev.year)) return null;
  const y = Number(ev.year);
  return eras.find(e => hasYear(e.from) && y >= Number(e.from) && (!hasYear(e.to) || y <= Number(e.to))) || null;
}
const tlColor = ev => COLORS.includes(ev.color) && ev.color ? ev.color : TL_CAT_COLOR[ev.cat] || "slate";
function tlVisible(ev) {
  if (S.tl.view === "players" && ev.hidden) return false;
  if (S.tl.cat && ev.cat !== S.tl.cat) return false;
  const q = S.tl.q.trim().toLowerCase(); if (!q) return true;
  const cards = (ev.cards || []).map(id => S.cards.get(id)?.title || "").join(" ");
  return [ev.title, ev.label, ev.told, S.tl.view === "gm" ? ev.truth : "", cards].join(" ").toLowerCase().includes(q);
}

/* ----- the page ----- */
function renderTimeline() {
  const eras = tlEras(), all = tlEvents(), shown = all.filter(tlVisible), set = tlSettings();
  const ids = [...all, ...eras];
  const sel = pickSel("timeline", ids, null);
  const selDoc = sel && S.mod.timeline.get(sel);
  const players = S.tl.view === "players";
  const bar = `<div class="tl-bar">
    <div class="tl-bar-l"><h2>Historical Timeline</h2>
      ${S.canWrite ? `<button type="button" class="btn primary small" data-do="tl-new-event">+ Event</button><button type="button" class="btn small" data-do="tl-new-era">+ Era</button>` : ""}</div>
    <div class="tl-bar-r">
      <input type="search" id="tl-q" placeholder="Search events and cards" aria-label="Search the timeline" value="${esc(S.tl.q)}">
      <select data-change="tl-cat" aria-label="Category"><option value="">All categories</option>${TL_CATS.slice(1).map(([v, l]) => `<option value="${v}" ${S.tl.cat === v ? "selected" : ""}>${l}</option>`).join("")}</select>
      <span class="seg" role="group" aria-label="Whose view"><button type="button" data-do="tl-view" data-v="gm" aria-pressed="${!players}">GM view</button><button type="button" data-do="tl-view" data-v="players" aria-pressed="${players}">Players' view</button></span>
    </div></div>`;
  const settings = S.canWrite ? `<details class="tl-settings"><summary>Calendar</summary><div class="mgrid">
      ${fInput("timeline", "_settings", "suffix", "Year suffix", { ph: "DR, AC, years after the Fall…" })}
      ${fInput("timeline", "_settings", "now", "The present year", { type: "number", ph: "1492" })}</div>
      <p class="hint">Years can be negative for dates before your calendar's year zero.</p></details>` : "";
  const body = !all.length && !eras.length
    ? `<div class="mempty-detail"><h2>Your world's history</h2><p>Add events (a founding, a war, a betrayal) and eras that span centuries. For each event, write what people believe and what really happened, and link the storyboard cards involved.</p>
        ${S.canWrite ? `<div class="actions"><button type="button" class="btn primary" data-do="tl-new-event">+ First event</button><button type="button" class="btn" data-do="tl-new-era">+ An era</button></div>` : ""}</div>`
    : `${tlOverview(all.filter(e => !(players && e.hidden)), eras, set, sel)}${tlList(shown, eras, sel, players, all.length)}`;
  const detail = players || !selDoc ? "" : selDoc.type === "era" ? tlEraDetail(selDoc) : tlEventDetail(selDoc, eras);
  return `<div class="tl-mod${detail ? "" : " no-detail"}"><div class="tl-main">${bar}${settings}${body}</div>${detail ? `<div class="tl-side">${detail}</div>` : ""}</div>`;
}
function tlOverview(events, eras, set, sel) {
  const ys = [...events.filter(e => hasYear(e.year)).map(e => Number(e.year)), ...eras.flatMap(e => [e.from, e.to].filter(hasYear).map(Number)), ...(hasYear(set.now) ? [Number(set.now)] : [])];
  if (!ys.length) return "";
  let lo = Math.min(...ys), hi = Math.max(...ys);
  if (lo === hi) { lo -= 10; hi += 10; }
  const pad = (hi - lo) * 0.03; lo -= pad; hi += pad;
  const x = y => ((Number(y) - lo) / (hi - lo) * 100).toFixed(2);
  const bands = eras.filter(e => hasYear(e.from)).map(e => {
    const a = x(e.from), b = x(hasYear(e.to) ? e.to : hi);
    return `<button type="button" class="tl-band" data-do="tl-jump" data-id="${esc(e.id)}" style="left:${a}%;width:${Math.max(0.6, b - a)}%;--bc:var(--c-${COLORS.includes(e.color) && e.color ? e.color : "slate"})" title="${esc(e.title || "Era")} (${esc(tlYear(e.from))} – ${hasYear(e.to) ? esc(tlYear(e.to)) : "now"})"><span>${esc(e.title || "Era")}</span></button>`;
  }).join("");
  const ticks = events.filter(e => hasYear(e.year)).map(e => `<button type="button" class="tl-tick${e.major ? " major" : ""}${e.id === sel ? " sel" : ""}" data-do="tl-jump" data-id="${esc(e.id)}" style="left:${x(e.year)}%;--tc:var(--c-${tlColor(e)})" title="${esc(tlYear(e.year))}: ${esc(e.title || "Event")}" aria-label="${esc(e.title || "Event")}, ${esc(tlYear(e.year))}"></button>`).join("");
  const now = hasYear(set.now) ? `<div class="tl-now${x(set.now) > 70 ? " flip" : ""}" style="left:${x(set.now)}%"><span>Now · ${esc(tlYear(set.now))}</span></div>` : "";
  return `<div class="tl-over" aria-label="Overview of the whole timeline">
    <div class="tl-track">${bands}${ticks}${now}</div>
    <div class="tl-scale"><span>${esc(tlYear(Math.round(lo + pad)))}</span><span>${esc(tlYear(Math.round(hi - pad)))}</span></div>
  </div>`;
}
function tlList(events, eras, sel, players, total) {
  if (!events.length) return `<p class="hint tl-none">${total ? "No events match. Clear the search or category." : "No events yet."}</p>`;
  let out = "", lastEra = undefined, prevY = null;
  const span = (() => { const ys = events.filter(e => hasYear(e.year)).map(e => Number(e.year)); return ys.length > 1 ? Math.max(...ys) - Math.min(...ys) : 0; })();
  const now = tlSettings().now; let nowDone = !hasYear(now);
  for (const ev of events) {
    const era = tlEraOf(ev, eras);
    if (!nowDone && hasYear(ev.year) && Number(ev.year) > Number(now)) { out += `<div class="tl-nowline"><span>Now · ${esc(tlYear(now))}</span></div>`; nowDone = true; }
    if ((era && era.id) !== (lastEra && lastEra.id)) {
      if (lastEra && !era) out += `<div class="tl-era-end" style="--bc:var(--c-${COLORS.includes(lastEra.color) && lastEra.color ? lastEra.color : "slate"})">End of ${esc(lastEra.title || "the era")}${hasYear(lastEra.to) ? " · " + esc(tlYear(lastEra.to)) : ""}</div>`;
      if (era) out += `<button type="button" class="tl-era" data-do="select" data-mod="timeline" data-id="${esc(era.id)}" aria-current="${era.id === sel}" style="--bc:var(--c-${COLORS.includes(era.color) && era.color ? era.color : "slate"})">
        <span class="tl-era-name">${esc(era.title || "Era")}</span><span class="tl-era-range mono">${esc(tlYear(era.from))} – ${hasYear(era.to) ? esc(tlYear(era.to)) : "now"}</span></button>`;
      lastEra = era; prevY = null;
    }
    if (prevY != null && hasYear(ev.year)) {
      const gap = Number(ev.year) - prevY;
      if (gap > 0 && span && (gap >= 50 || gap / span > 0.15)) out += `<div class="tl-gap">· ${gap.toLocaleString()} year${gap === 1 ? "" : "s"} ·</div>`;
    }
    if (hasYear(ev.year)) prevY = Number(ev.year);
    const cards = (ev.cards || []).map(id => S.cards.get(id)).filter(Boolean);
    const told = String(ev.told || "").trim(), truth = String(ev.truth || "").trim();
    out += `<article class="tl-ev${ev.major ? " major" : ""}${ev.id === sel ? " sel" : ""}${ev.hidden ? " secret" : ""}" id="tl-${esc(ev.id)}" style="--tc:var(--c-${tlColor(ev)})">
      <div class="tl-when mono">${esc(ev.label || tlYear(ev.year))}</div>
      <div class="tl-dot" aria-hidden="true"></div>
      <div class="tl-card">
        <button type="button" class="tl-head" data-do="select" data-mod="timeline" data-id="${esc(ev.id)}" aria-current="${ev.id === sel}">
          <span class="tl-title">${esc(ev.title || "Untitled event")}</span>
          ${ev.cat ? `<span class="tl-cat">${esc((TL_CATS.find(c => c[0] === ev.cat) || [])[1] || ev.cat)}</span>` : ""}
          ${ev.hidden && !players ? `<span class="tl-secret">Players don't know</span>` : ""}
        </button>
        ${told ? `<div class="tl-told">${md(told)}</div>` : ""}
        ${!players && truth ? `<div class="tl-truth"><b>What really happened</b>${md(truth)}</div>` : ""}
        ${cards.length ? `<div class="linkchips tl-cards">${cards.map(c => cardChip(c)).join("")}</div>` : ""}
      </div>
    </article>`;
  }
  if (!nowDone) out += `<div class="tl-nowline"><span>Now · ${esc(tlYear(now))}</span></div>`;
  return `<div class="tl-list" data-keep-scroll="tl-list">${out}</div>`;
}
function tlEventDetail(ev, eras) {
  const m = "timeline", i = ev.id;
  const linked = (ev.cards || []).map(id => S.cards.get(id)).filter(Boolean);
  const linkable = [...S.cards.values()].filter(c => !c.archived && !(ev.cards || []).includes(c.id)).sort((a, b) => String(a.title).localeCompare(String(b.title)));
  const next = COLORS[(COLORS.indexOf(ev.color || "") + 1) % COLORS.length];
  return `<section class="mdetail tl-detail" aria-label="Event">
    <div class="row-between"><span class="hint">Event</span><button type="button" class="btn ghost small" data-do="tl-close">Close</button></div>
    ${fInput(m, i, "title", "Event", { cls: "big", ph: "The Sundering of the Seven" })}
    <div class="mgrid">${fInput(m, i, "year", "Year", { type: "number", ph: "1203" })}${fInput(m, i, "label", "Date as written", { ph: "Spring, 1203 DR (optional)" })}</div>
    <div class="mgrid">${fSelect(m, i, "cat", "Category", TL_CATS)}${fSelect(m, i, "era", "Era", [["", "By year (automatic)"], ...eras.map(e => [e.id, e.title || "Era"])])}</div>
    <div class="tl-flags">
      <label class="chk">${fCheck(m, i, "major", "Major event")} Major event</label>
      <label class="chk">${fCheck(m, i, "hidden", "Players don't know about this")} Players don't know about this</label>
      ${S.canWrite ? `<button type="button" class="btn ghost small tl-sw" data-do="tl-color" data-id="${esc(i)}" data-c="${next}" style="--nn:var(--c-${tlColor(ev)})">Colour</button>` : ""}
    </div>
    ${fArea(m, i, "told", "What people believe", { rows: fitRows(ev.told, 4), ph: "The account in histories, songs and temple records" })}
    <div class="gm-box">${fArea(m, i, "truth", "What really happened", { rows: fitRows(ev.truth, 4), hint: "GM only. Never shown in the players' view.", ph: "The truth behind the story" })}</div>
    <div class="msec"><h3>Linked cards</h3>
      <div class="linkchips">${linked.map(c => cardChip(c, "", S.canWrite ? `data-do="tl-unlink" data-id="${esc(i)}" data-cid="${esc(c.id)}"` : "")).join("") || `<span class="hint">None linked yet.</span>`}</div>
      ${S.canWrite && linkable.length ? `<select data-change="tl-link" data-id="${esc(i)}" aria-label="Link a storyboard card"><option value="">Link a card…</option>${linkable.map(c => `<option value="${esc(c.id)}">${esc(c.title || "Untitled")} (${esc(KIND[c.kind]?.label || c.kind)})</option>`).join("")}</select>` : ""}
    </div>
    <div class="md-foot"><span class="spacer"></span>${delBtn("tl", i, "Delete event", "tl-del")}</div>
  </section>`;
}
function tlEraDetail(era) {
  const m = "timeline", i = era.id;
  const n = tlEvents().filter(ev => (tlEraOf(ev, tlEras()) || {}).id === i).length;
  return `<section class="mdetail tl-detail" aria-label="Era">
    <div class="row-between"><span class="hint">Era · ${n} event${n === 1 ? "" : "s"}</span><button type="button" class="btn ghost small" data-do="tl-close">Close</button></div>
    ${fInput(m, i, "title", "Era", { cls: "big", ph: "The Age of Ash" })}
    <div class="mgrid">${fInput(m, i, "from", "From year", { type: "number" })}${fInput(m, i, "to", "To year", { type: "number", ph: "Blank = still going" })}${fSelect(m, i, "color", "Colour", COLORS.map(c => [c, c ? c[0].toUpperCase() + c.slice(1) : "Grey"]))}</div>
    ${fArea(m, i, "body", "About this era", { rows: fitRows(era.body, 4) })}
    <p class="hint">Events fall into an era by their year, unless you pick an era on the event.</p>
    <div class="md-foot"><span class="spacer"></span>${delBtn("tl", i, "Delete era", "tl-del")}</div>
  </section>`;
}

/* ----- the card pages show the events they're part of ----- */
const _tlConnections = connections;
connections = function (c) {
  const base = _tlConnections(c);
  if (!S.canGM) return base;
  const evs = tlEvents().filter(ev => (ev.cards || []).includes(c.id));
  if (!evs.length) return base;
  const chips = evs.map(ev => `<span class="lchip"><button type="button" class="go" data-do="goto" data-tab="timeline" data-id="${esc(ev.id)}">${esc(ev.title || "Event")}</button><em>${esc(ev.label || tlYear(ev.year))}</em></span>`).join("");
  return base ? base.replace(/<\/div><\/div>\s*$/, chips + "</div></div>") : `<div class="msec"><h3>Connections</h3><div class="linkchips">${chips}</div></div>`;
};

/* ----- actions ----- */
function tlNew(fields) {
  const id = "tl_" + uid();
  putDoc("timeline", id, { created: new Date().toISOString(), cards: [], ...fields }, false);
  S.sel.timeline = id; S.tl.scrollTo = id; render();
  setTimeout(() => focusField?.("timeline", id, "title"), 30);
}
Object.assign(ACTIONS, {
  "tl-new-event": () => {
    const evs = tlEvents(), sel = S.mod.timeline.get(S.sel.timeline);
    const year = sel && sel.type === "event" && hasYear(sel.year) ? Number(sel.year) : sel && sel.type === "era" && hasYear(sel.from) ? Number(sel.from) : evs.length && hasYear(evs.at(-1).year) ? Number(evs.at(-1).year) : (hasYear(tlSettings().now) ? Number(tlSettings().now) : "");
    tlNew({ type: "event", title: "", year, label: "", cat: "", era: "", told: "", truth: "", major: false, hidden: false });
  },
  "tl-new-era": () => {
    const eras = tlEras(), last = eras.at(-1);
    tlNew({ type: "era", title: "", from: last && hasYear(last.to) ? Number(last.to) + 1 : "", to: "", color: COLORS[(eras.length % (COLORS.length - 1)) + 1], body: "" });
  },
  "tl-del": d => { S.confirm = null; const doc = S.mod.timeline.get(d.id); if (doc?.type === "era") for (const ev of tlEvents().filter(e => e.era === d.id)) putDoc("timeline", ev.id, { ...ev, era: "" }, false); delDoc("timeline", d.id); S.sel.timeline = null; toast(doc?.type === "era" ? "Era deleted; its events stay on the timeline" : "Event deleted"); },
  "tl-close": () => { S.sel.timeline = "__none"; renderModule(); },
  "tl-view": d => { S.tl.view = d.v; renderModule(); },
  "tl-jump": d => { S.sel.timeline = d.id; S.tl.scrollTo = d.id; renderModule(); },
  "tl-color": d => { commit("timeline", d.id, "color", d.c); renderModule(); },
  "tl-unlink": d => { const ev = docCopy("timeline", d.id); ev.cards = (ev.cards || []).filter(x => x !== d.cid); putDoc("timeline", d.id, ev); },
});
Object.assign(CHANGES, {
  "tl-cat": (d, el) => { S.tl.cat = el.value; renderModule(); },
  "tl-link": (d, el) => { if (!el.value) return; const ev = docCopy("timeline", d.id); ev.cards = [...(ev.cards || []), el.value]; putDoc("timeline", d.id, ev); },
});
document.addEventListener("input", e => { if (e.target.id === "tl-q") { S.tl.q = e.target.value; renderModule(); } });
/* keep "__none" (closed editor) from being replaced by the first item */
const _tlPickSel = pickSel;
pickSel = function (mod, list, fallback) { if (mod === "timeline" && S.sel.timeline === "__none") return null; return _tlPickSel(mod, list, fallback); };
/* scroll a jumped-to event into view after the page draws */
const _tlRenderModule = renderModule;
renderModule = function () {
  const r = _tlRenderModule();
  if (S.tab === "timeline" && S.tl.scrollTo) { const id = S.tl.scrollTo; S.tl.scrollTo = null; requestAnimationFrame(() => document.getElementById("tl-" + id)?.scrollIntoView({ block: "center", behavior: "smooth" })); }
  return r;
};
