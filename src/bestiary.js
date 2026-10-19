/* ===================== Bestiary & Reference (SRD 5.2) ===================== */
const SRD_CREDIT = `This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noopener">dndbeyond.com/srd</a>. The SRD 5.2 is licensed under the <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" rel="noopener">Creative Commons Attribution 4.0 International License</a>.`;
const MON = new Map(SRD.monsters.map(m => [m.i, m]));
const MON_BY_NAME = new Map(SRD.monsters.map(m => [m.n.toLowerCase(), m]));
const crNum = cr => cr === "1/8" ? 0.125 : cr === "1/4" ? 0.25 : cr === "1/2" ? 0.5 : Number(cr) || 0;
const abMod = v => { const n = Math.floor((Number(v) - 10) / 2); return (n >= 0 ? "+" : "−") + Math.abs(n); };
function md(t) {
  if (!t) return "";
  const lines = String(t).split("\n");
  let out = "", para = [], table = [];
  const inline = s => esc(s).replace(/\*\*\*(.+?)\*\*\*/g, "<b><i>$1</i></b>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])\*([^*\n]+?)\*(?!\*)/g, "$1<i>$2</i>").replace(/(^|\W)_([^_\n]+?)_(?=\W|$)/g, "$1<i>$2</i>");
  const flushP = () => { if (para.length) { out += `<p>${para.map(inline).join("<br>")}</p>`; para = []; } };
  const flushT = () => {
    if (!table.length) return;
    const rows = table.filter(r => !/^\|?\s*:?-{2,}/.test(r)).map(r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim()));
    out += `<div class="mtable-wrap"><table class="rt"><thead><tr>${rows[0].map(c => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    table = [];
  };
  for (const raw of lines) {
    const l = raw.trim();
    if (l.startsWith("|")) { flushP(); table.push(l); continue; }
    flushT();
    if (!l) { flushP(); continue; }
    if (/^#+\s/.test(l)) { flushP(); out += `<h4>${inline(l.replace(/^#+\s/, ""))}</h4>`; continue; }
    para.push(l.replace(/^[-•]\s+/, "• "));
  }
  flushP(); flushT();
  return out;
}
const plain = t => String(t || "").replace(/\*+/g, "").replace(/_/g, "");

/* ----- stat block ----- */
function statBlock(m) {
  const sec = (title, list, intro) => list && list.length ? `<div class="sb-sec"><h3>${title}</h3>${intro ? `<p class="hint">${esc(intro)}</p>` : ""}${list.map(([n, d]) => `<div class="sb-entry"><b>${esc(n)}.</b> ${md(d).replace(/^<p>/, "").replace(/<\/p>$/, "")}</div>`).join("")}</div>` : "";
  const line = (k, v) => v ? `<div><b>${k}</b> ${esc(v)}</div>` : "";
  const saves = {}; (m.sv || "").split(", ").filter(Boolean).forEach(s => { const [a, v] = s.split(" "); saves[a.slice(0, 3).toUpperCase()] = v; });
  return `<div class="statblock">
    <div class="sb-head"><h2>${esc(m.n)}</h2><div class="sb-type">${esc(m.sz)} ${esc(m.t)}${m.al ? ", " + esc(m.al) : ""}</div></div>
    <div class="sb-core">${line("AC", m.ac)}${line("HP", m.hp + (m.hd ? ` (${m.hd})` : ""))}${line("Speed", m.sp)}<div><b>Initiative</b> ${m.init == null ? abMod(m.ab[1]) : esc(m.init)}</div></div>
    <div class="sb-abil">${ABILS.map((a, k) => `<div><span>${a}</span><b>${m.ab[k]}</b><em>${abMod(m.ab[k])}${saves[a] && saves[a] !== abMod(m.ab[k]).replace("−", "-") ? ` · save ${saves[a]}` : ""}</em></div>`).join("")}</div>
    <div class="sb-props">${line("Skills", m.sk)}${line("Vulnerabilities", m.vu)}${line("Resistances", m.re)}${line("Immunities", [m.im, m.ci].filter(Boolean).join("; "))}${line("Gear", m.g)}${line("Senses", m.se)}${line("Languages", m.la || "—")}
      <div><b>CR</b> ${esc(m.cr)} (XP ${fmtN(m.xp)}; PB +${m.pb})</div></div>
    ${sec("Traits", m.tr)}${sec("Actions", m.a)}${sec("Bonus Actions", m.b)}${sec("Reactions", m.r)}${sec("Legendary Actions", m.l)}
  </div>`;
}
function monsterText(m) {
  const part = (t, l) => l && l.length ? `${t}\n${l.map(([n, d]) => `${n}. ${plain(d)}`).join("\n")}\n` : "";
  return [part("Traits", m.tr), part("Actions", m.a), part("Bonus Actions", m.b), part("Reactions", m.r), part("Legendary Actions", m.l)].filter(Boolean).join("\n").trim();
}

/* ----- Bestiary tab ----- */
S.best = { q: "", cr: "", type: "", sort: "name" };
const CR_BANDS = [["", "Any CR"], ["0-1", "CR 0–1"], ["2-4", "CR 2–4"], ["5-10", "CR 5–10"], ["11-16", "CR 11–16"], ["17-30", "CR 17+"]];
const MON_TYPES = [...new Set(SRD.monsters.map(m => m.t.split(" ")[0].replace(/[^a-z]/gi, "").toLowerCase()))].filter(Boolean).sort();
function bestiaryList() {
  const q = S.best.q.trim().toLowerCase();
  const [lo, hi] = S.best.cr ? S.best.cr.split("-").map(Number) : [null, null];
  return SRD.monsters.filter(m => (!q || m.n.toLowerCase().includes(q) || m.t.toLowerCase().includes(q))
      && (lo == null || (crNum(m.cr) >= lo && crNum(m.cr) <= hi) || (lo === 0 && crNum(m.cr) < 1))
      && (!S.best.type || m.t.toLowerCase().startsWith(S.best.type)))
    .sort((a, b) => S.best.sort === "cr" ? crNum(a.cr) - crNum(b.cr) || a.n.localeCompare(b.n) : a.n.localeCompare(b.n));
}
function renderBestiary() {
  const list = bestiaryList();
  const id = pickSel("bestiary", list.map(m => ({ id: m.i })));
  const items = list.map(m => ({ id: m.i, title: m.n, sub: `${m.sz} ${m.t}`, badge: `<span class="mono hint">CR ${esc(m.cr)}</span>` }));
  const filters = `<input id="best-q" type="search" data-q="best" placeholder="Search ${SRD.monsters.length} creatures" aria-label="Search creatures" value="${esc(S.best.q)}">
    <select data-change="best-cr" aria-label="Challenge rating">${CR_BANDS.map(([v, l]) => `<option value="${v}" ${v === S.best.cr ? "selected" : ""}>${l}</option>`).join("")}</select>
    <select data-change="best-type" aria-label="Creature type"><option value="">Any type</option>${MON_TYPES.map(t => `<option value="${t}" ${t === S.best.type ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select>
    <select data-change="best-sort" aria-label="Sort"><option value="name" ${S.best.sort === "name" ? "selected" : ""}>A–Z</option><option value="cr" ${S.best.sort === "cr" ? "selected" : ""}>By CR</option></select>`;
  const m = id && MON.get(id);
  return `<div class="mod">${listPane({ mod: "bestiary", title: "Bestiary", items, sel: id, empty: "No creature matches.", filters })}
    ${m ? `<section class="mdetail" aria-label="${esc(m.n)}">${bestiaryActions(m)}${statBlock(m)}<p class="credit">${SRD_CREDIT}</p></section>`
      : emptyDetail("No creature matches", "Try a shorter search, or clear the CR and type filters.")}</div>`;
}
function bestiaryActions(m) {
  if (!S.canGM || !S.canWrite) return "";
  const combats = sortedCombats();
  return `<div class="best-actions">
    ${combats.length ? `<select id="best-enc" aria-label="Encounter to add to">${combats.map(c => `<option value="${esc(c.id)}" ${c.id === S.sel.combats ? "selected" : ""}>${esc(c.title || "Untitled encounter")}</option>`).join("")}<option value="__new">New encounter</option></select>` : ""}
    <input id="best-count" type="number" min="1" value="1" aria-label="How many" class="short">
    <button type="button" class="btn primary" data-do="best-to-enc" data-id="${esc(m.i)}">${combats.length ? "Add to encounter" : "Start an encounter with it"}</button>
    <button type="button" class="btn" data-do="best-to-screen" data-id="${esc(m.i)}">Drop on DM Screen</button>
  </div>`;
}
function monsterRow(m, count) { return { name: m.n, cr: m.cr, count, ac: m.ac, hp: m.hp, srd: m.i }; }
Object.assign(ACTIONS, {
  "best-to-enc": d => {
    const m = MON.get(d.id); if (!m) return;
    const count = Math.max(1, int($("#best-count")?.value) || 1);
    let encId = $("#best-enc")?.value;
    if (!encId || encId === "__new") {
      encId = uid();
      putDoc("combats", encId, { title: `${m.n} encounter`, where: "", status: "prep", ...partyDefaults(), monsters: [monsterRow(m, count)], tactics: "", loot: "", run: null, created: new Date().toISOString() }, false);
    } else {
      const c = docCopy("combats", encId);
      const existing = (c.monsters || []).find(x => x.srd === m.i && !c.run);
      if (existing) existing.count = int(existing.count) + count;
      else c.monsters = [...(c.monsters || []).filter(x => x.name || int(x.count) !== 1 || x.hp), monsterRow(m, count)];
      putDoc("combats", encId, c, false);
    }
    S.sel.combats = encId; render();
    toast(`Added ${count} × ${m.n} to “${S.mod.combats.get(encId)?.title || "encounter"}”`);
  },
  "best-to-screen": d => {
    const m = MON.get(d.id); if (!m) return;
    const id = "p_" + uid();
    putDoc("screen", id, { type: "monster", title: m.n, ac: m.ac, hpMax: m.hp, speed: m.sp, cr: m.cr, copies: 1, srd: m.i,
      ab: Object.fromEntries(ABILS.map((a, k) => [a, m.ab[k]])), actions: monsterText(m) }, false);
    commit("screen", "layout", "order", [id, ...allPanels().map(p => p.id).filter(x => x !== id)]);
    commit("screen", "layout", "pos." + id, { x: 0, y: -1 });
    S.screenOff = S.screenOff.filter(x => x !== id);
    render(); toast(`${m.n} is on the DM Screen`);
  },
});
Object.assign(CHANGES, {
  "best-cr": (d, el) => { S.best.cr = el.value; renderModule(); },
  "best-type": (d, el) => { S.best.type = el.value; renderModule(); },
  "best-sort": (d, el) => { S.best.sort = el.value; renderModule(); },
  "best-add": (d, el) => {
    const m = MON_BY_NAME.get(el.value.trim().toLowerCase());
    if (!m) { toast("Pick a creature from the list"); return; }
    const c = docCopy("combats", d.id);
    c.monsters = [...(c.monsters || []).filter(x => x.name || x.hp), monsterRow(m, 1)];
    putDoc("combats", d.id, c);
    setTimeout(() => { const i = document.getElementById("best-add-" + d.id); if (i) { i.value = ""; i.focus(); } }, 30);
  },
});

/* ----- Reference tab ----- */
const REF_CATS = [
  ["spells", "Spells"], ["items", "Magic items"], ["conditions", "Conditions"], ["equipment", "Equipment"],
  ["feats", "Feats"], ["mastery", "Weapon mastery"], ["wprops", "Weapon properties"], ["poisons", "Poisons"], ["monsters", "Creatures"],
];
const REF_ALL = REF_CATS.flatMap(([cat, label]) => SRD[cat].map((x, n) => ({ key: cat + ":" + n, cat, label, x, name: x.n, lname: x.n.toLowerCase() })));
S.ref = { q: "", cat: "" };
function refSub(r) {
  const x = r.x;
  if (r.card) return (r.card.tags || []).join(", ") || "Item card";
  if (r.cat === "spells") return `${x.lv ? "Level " + x.lv : "Cantrip"} ${x.sc}${x.cn ? " · Concentration" : ""}${x.ri ? " · Ritual" : ""}`;
  if (r.cat === "items") return `${x.ca}${x.ra ? " · " + x.ra : ""}${x.at ? " · attunement" : ""}`;
  if (r.cat === "equipment") return [x.ca, x.s].filter(Boolean).join(" · ");
  if (r.cat === "monsters") return `CR ${x.cr} · ${x.sz} ${x.t}`;
  if (x.ty) return x.ty[0].toUpperCase() + x.ty.slice(1);
  return r.label;
}
/* your own things, searched alongside the SRD: homebrew creatures and Item cards */
function refHomebrew() {
  const out = [];
  for (const m of MON.values()) if (m.hb) out.push({ key: "hb:" + m.i, cat: "monsters", label: "Homebrew creature", x: m, name: m.n, lname: (m.n || "").toLowerCase(), hb: true });
  for (const c of S.cards.values()) if (c.kind === "item" && c.title) out.push({ key: "card:" + c.id, cat: "items", label: "Your item", x: { n: c.title, d: c.body || "" }, card: c, name: c.title, lname: c.title.toLowerCase(), hb: true });
  return out;
}
function refSearch(q, cat, limit = 300) {
  q = q.trim().toLowerCase();
  let list = [...refHomebrew(), ...REF_ALL].filter(r => !cat || r.cat === cat);
  if (q) {
    const scored = [];
    for (const r of list) {
      let s = r.lname === q ? 0 : r.lname.startsWith(q) ? 1 : r.lname.includes(q) ? 2 : -1;
      if (s < 0 && q.length >= 3 && (r.x.d || "").toLowerCase().includes(q)) s = 3;
      if (s >= 0) scored.push([s, r]);
    }
    list = scored.sort((a, b) => a[0] - b[0] || (b[1].hb ? 1 : 0) - (a[1].hb ? 1 : 0) || a[1].name.localeCompare(b[1].name)).map(x => x[1]);
  } else list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
  return list.slice(0, limit);
}
function refDetail(r) {
  const x = r.x;
  if (r.card) {
    const c = r.card, gm = S.canGM ? S.gm.get(c.id) : "";
    return `<div class="statblock"><div class="sb-head"><h2>${esc(c.title)}</h2><div class="sb-type"><span class="hb-tag">Your item</span>${(c.tags || []).length ? " · " + esc(c.tags.join(", ")) : ""}</div></div>
      <div class="ref-body">${md(c.body || "") || `<p class="hint">No description yet.</p>`}${gm ? `<h4>GM notes</h4>${md(gm)}` : ""}</div></div>
      <div><button type="button" class="btn" data-do="open-card" data-id="${esc(c.id)}">Open the card</button></div>`;
  }
  if (r.cat === "monsters") return `${statBlock(x)}<div><button type="button" class="btn" data-do="goto" data-tab="bestiary" data-id="${esc(x.i)}">Open in Bestiary</button></div>`;
  let head = "";
  if (r.cat === "spells") head = `<div class="sb-core"><div><b>Casting time</b> ${esc(x.ct)}</div><div><b>Range</b> ${esc(x.rg)}</div><div><b>Components</b> ${esc(x.co)}</div><div><b>Duration</b> ${x.cn ? "Concentration, " : ""}${esc(x.du)}</div>${x.cl ? `<div><b>Classes</b> ${esc(x.cl)}</div>` : ""}</div>`;
  if (r.cat === "equipment" && x.s) head = `<div class="sb-core"><div>${esc(x.s)}</div></div>`;
  return `<div class="statblock"><div class="sb-head"><h2>${esc(x.n)}</h2><div class="sb-type">${esc(refSub(r))}</div></div>${head}
    <div class="ref-body">${md(x.d) || `<p class="hint">No description.</p>`}${x.h ? `<h4>Using a higher-level spell slot</h4>${md(x.h)}` : ""}</div></div>`;
}
/* categories in the Reference filter, with counts (other files add imported ones) */
function refCats() { return REF_CATS.map(([c, l]) => [c, l, SRD[c].length]); }
function renderReference() {
  const list = refSearch(S.ref.q, S.ref.cat);
  const id = pickSel("reference", list.map(r => ({ id: r.key })));
  const items = list.map(r => ({ id: r.key, title: r.name, sub: refSub(r), badge: S.ref.cat ? "" : `<span class="mono hint">${esc(r.label)}</span>` }));
  const filters = `<input id="ref-q" type="search" data-q="ref" placeholder="Search spells, items, rules…" aria-label="Search the reference" value="${esc(S.ref.q)}">
    <select data-change="ref-cat" aria-label="Category"><option value="">Everything</option>${refCats().map(([c, l, n]) => `<option value="${c}" ${c === S.ref.cat ? "selected" : ""}>${l} (${n})</option>`).join("")}</select>`;
  const r = id && (list.find(x => x.key === id) || REF_ALL.find(x => x.key === id));
  return `<div class="mod">${listPane({ mod: "reference", title: "Reference", items, sel: id, empty: "Nothing matches.", filters })}
    ${r ? `<section class="mdetail" aria-label="${esc(r.name)}">${refDetail(r)}${r.hb ? "" : `<p class="credit">${SRD_CREDIT}</p>`}</section>` : emptyDetail("Nothing matches", "Try a shorter word, or search Everything.")}</div>`;
}
CHANGES["ref-cat"] = (d, el) => { S.ref.cat = el.value; renderModule(); };

/* ----- DM Screen: quick lookup panel ----- */
S.quick = { q: "", open: null };
function quickPanel() {
  const res = S.quick.q.trim() ? refSearch(S.quick.q, "", 12) : [];
  return `<h2>Quick Lookup</h2>
    <input id="quick-q" class="spell-search" type="search" data-q="quick" placeholder="Any spell, item, condition, creature, or your own…" aria-label="Quick lookup" value="${esc(S.quick.q)}">
    <div class="quick-list" data-keep-scroll="quick">${res.map(r => `<details ${S.quick.open === r.key ? "open" : ""} data-quick="${esc(r.key)}"><summary><b>${esc(r.name)}</b> ${r.hb ? `<span class="hb-tag">${r.card ? "Your item" : (r.mi || r.rh) ? esc((r.mi || r.rh).book || "Homebrew") : "Homebrew"}</span> ` : ""}<span class="hint">${r.hb ? "" : esc(r.label) + " · "}${esc(refSub(r))}</span></summary>${refDetail(r)}</details>`).join("")
      || (S.quick.q.trim() ? `<p class="hint">Nothing matches.</p>` : `<p class="hint">Full SRD 5.2 text for ${REF_ALL.length} entries${(n => n ? `, plus ${n} homebrew creature${n === 1 ? "" : "s"} and item${n === 1 ? "" : "s"} of your own` : "")(refHomebrew().length)}.</p>`)}</div>`;
}
document.addEventListener("toggle", e => { const dt = e.target.closest?.("[data-quick]"); if (dt) S.quick.open = dt.open ? dt.dataset.quick : (S.quick.open === dt.dataset.quick ? null : S.quick.open); }, true);

/* ----- register: tabs, the DM Screen panel, and the input boxes ----- */
MODULES.splice(MODULES.findIndex(m => m.id === "combats") + 1, 0,
  { id: "bestiary", label: "Bestiary", render: () => renderBestiary() },
  { id: "reference", label: "Reference", render: () => renderReference() });
SCREEN_PANELS.splice(2, 0, { id: "quick", title: "Quick Lookup" });
SCREEN_STATIC.quick = quickPanel;
(() => {
  const dl = document.createElement("datalist");
  dl.id = "srd-monster-list";
  dl.innerHTML = SRD.monsters.slice().sort((a, b) => a.n.localeCompare(b.n)).map(m => `<option value="${esc(m.n)}">CR ${esc(m.cr)} · ${esc(m.t)}</option>`).join("");
  document.body.appendChild(dl);
})();
const _qInput = e => {
  const q = e.target.closest("[data-q]"); if (!q) return;
  const k = q.dataset.q;
  if (k === "best") S.best.q = q.value; else if (k === "ref") S.ref.q = q.value; else if (k === "quick") S.quick.q = q.value; else return;
  e.stopImmediatePropagation(); renderModule();
};
document.addEventListener("input", _qInput, true);
