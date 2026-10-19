/* ===================== Homebrew creatures in the Bestiary =====================
   Your own creatures, saved per campaign (gmx/<board>/creatures) so they travel
   with campaign files. Each one uses the same stat block format as an NPC
   (`sb`), plus optional lore and a combat role. They're listed in the Bestiary
   above the SRD creatures and work everywhere an SRD creature does: add to an
   encounter, drop on the DM Screen, the "i" button in Combats. */
MOD_COLLS.push("creatures");
S.hbEdit = {};
S.best.src = S.best.src || "";
const HB_PREFIX = "hb-";
const hbDocs = () => [...((S.mod && S.mod.creatures) || new Map()).values()];
let hbIds = [];
function hbMonster(d) {
  const m = sbToMon({ title: d.title || "Creature", sb: d.sb || {} });
  return { ...m, i: HB_PREFIX + d.id, hb: true, doc: d.id, family: d.family || "", lore: d.lore || "", role: d.role || "" };
}
/* keep the Bestiary's lookups (MON, MON_BY_NAME) in step with this campaign's homebrew */
function syncHomebrew() {
  for (const id of hbIds) { const m = MON.get(id); MON.delete(id); if (m && MON_BY_NAME.get(m.n.toLowerCase()) === m) MON_BY_NAME.delete(m.n.toLowerCase()); }
  hbIds = [];
  for (const d of hbDocs()) {
    const m = hbMonster(d);
    MON.set(m.i, m); hbIds.push(m.i);
    if (!MON_BY_NAME.has(m.n.toLowerCase())) MON_BY_NAME.set(m.n.toLowerCase(), m);
  }
  const dl = document.getElementById("srd-monster-list");
  if (dl) { dl.querySelectorAll("option[data-hb]").forEach(o => o.remove()); dl.insertAdjacentHTML("afterbegin", hbIds.map(id => `<option data-hb value="${esc(MON.get(id).n)}">`).join("")); }
}
const _hbRenderModule = renderModule;
renderModule = function () { syncHomebrew(); return _hbRenderModule(); };

/* the list: homebrew first, then the SRD */
bestiaryList = function () {
  const q = S.best.q.trim().toLowerCase();
  const [lo, hi] = S.best.cr ? S.best.cr.split("-").map(Number) : [null, null];
  const ok = m => (!q || m.n.toLowerCase().includes(q) || m.t.toLowerCase().includes(q) || (m.family || "").toLowerCase().includes(q))
    && (lo == null || (crNum(m.cr) >= lo && crNum(m.cr) <= hi) || (lo === 0 && crNum(m.cr) < 1))
    && (!S.best.type || m.t.toLowerCase().startsWith(S.best.type));
  const sort = (a, b) => S.best.sort === "cr" ? crNum(a.cr) - crNum(b.cr) || a.n.localeCompare(b.n) : a.n.localeCompare(b.n);
  const hb = S.best.src === "srd" ? [] : hbIds.map(id => MON.get(id)).filter(Boolean).filter(ok).sort(sort);
  const srd = S.best.src === "hb" ? [] : SRD.monsters.filter(ok).sort(sort);
  return [...hb, ...srd];
};
renderBestiary = function () {
  const list = bestiaryList();
  const id = pickSel("bestiary", list.map(m => ({ id: m.i })));
  const items = list.map(m => ({ id: m.i, title: m.n, sub: `${m.hb && m.family ? m.family + " · " : ""}${m.sz} ${m.t}`,
    badge: `<span class="mono hint">${m.hb ? `<span class="hb-tag">Homebrew</span> ` : ""}CR ${esc(m.cr)}</span>` }));
  const total = SRD.monsters.length + hbIds.length;
  const filters = `<input id="best-q" type="search" data-q="best" placeholder="Search ${total} creatures" aria-label="Search creatures" value="${esc(S.best.q)}">
    <select data-change="best-src" aria-label="Which creatures"><option value="">All creatures</option><option value="hb" ${S.best.src === "hb" ? "selected" : ""}>Homebrew (${hbIds.length})</option><option value="srd" ${S.best.src === "srd" ? "selected" : ""}>SRD only</option></select>
    <select data-change="best-cr" aria-label="Challenge rating">${CR_BANDS.map(([v, l]) => `<option value="${v}" ${v === S.best.cr ? "selected" : ""}>${l}</option>`).join("")}</select>
    <select data-change="best-type" aria-label="Creature type"><option value="">Any type</option>${MON_TYPES.map(t => `<option value="${t}" ${t === S.best.type ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("")}</select>
    <select data-change="best-sort" aria-label="Sort"><option value="name" ${S.best.sort === "name" ? "selected" : ""}>A–Z</option><option value="cr" ${S.best.sort === "cr" ? "selected" : ""}>By CR</option></select>`;
  const m = id && MON.get(id);
  const detail = !m ? emptyDetail("No creature matches", "Try a shorter search, or clear the filters.", S.canGM ? "hb-new" : "", "+ New homebrew creature")
    : m.hb ? hbDetail(m)
    : `<section class="mdetail" aria-label="${esc(m.n)}">${bestiaryActions(m)}${S.canGM && S.canWrite ? `<div class="hb-copy"><button type="button" class="btn small ghost" data-do="hb-copy" data-id="${esc(m.i)}">Make a homebrew copy to change</button></div>` : ""}${statBlock(m)}<p class="credit">${SRD_CREDIT}</p></section>`;
  return `<div class="mod">${listPane({ mod: "bestiary", title: "Bestiary", items, sel: id, empty: "No creature matches.", filters, newDo: S.canGM ? "hb-new" : "", newLabel: "+ Creature" })}${detail}</div>`;
};
function hbDetail(m) {
  const d = S.mod.creatures.get(m.doc); if (!d) return "";
  const i = d.id, editing = !!S.hbEdit[i] && S.canWrite;
  const head = `<div class="row-between"><span class="hb-tag">Homebrew${d.family ? " · " + esc(d.family) : ""}</span>
    ${S.canWrite && S.canGM ? `<span class="actions"><button type="button" class="btn small" data-do="hb-edit" data-id="${esc(i)}">${editing ? "Done editing" : "Edit"}</button>
      <button type="button" class="btn small ghost" data-do="hb-dup" data-id="${esc(i)}">Duplicate</button>
      ${delBtn("hb", i, "Delete", "hb-del")}</span>` : ""}</div>`;
  if (!editing) {
    return `<section class="mdetail" aria-label="${esc(m.n)}">${head}${bestiaryActions(m)}
      ${d.role ? `<div class="hb-role"><h3>Combat role</h3>${md(d.role)}</div>` : ""}
      ${statBlock(m)}
      ${d.lore ? `<details class="hb-lore"${d.family ? "" : " open"}><summary>${d.family ? "About the " + esc(d.family) : "Lore"}</summary>${md(d.lore)}</details>` : ""}
    </section>`;
  }
  const mm = "creatures", f = (p, label, o) => fInput(mm, i, "sb." + p, label, o || {});
  return `<section class="mdetail" aria-label="${esc(m.n)}">${head}
    <div class="mgrid">${fInput(mm, i, "title", "Name", { wide: true, cls: "big" })}${fInput(mm, i, "family", "Family", { ph: "e.g. Goblinoids (groups related creatures)" })}</div>
    ${fArea(mm, i, "role", "Combat role", { rows: 2, ph: "What it's for in a fight" })}
    <div class="mgrid">${f("size", "Size", { ph: "Medium" })}${f("type", "Type", { ph: "Humanoid" })}${f("al", "Alignment", { ph: "Unaligned" })}${fSelect(mm, i, "sb.cr", "CR", CRS.map(x => [x]), { dflt: "1" })}</div>
    <div class="mgrid">${f("ac", "AC", { type: "number" })}${f("hp", "HP", { type: "number" })}${f("hd", "Hit dice", { ph: "6d8 + 6" })}${f("sp", "Speed", { ph: "30 ft." })}</div>
    <div class="abil">${ABILS.map((a, k) => `<label>${a}${fInput(mm, i, `sb.ab.${k}`, null, { type: "number", aria: a, ph: "10" })}<span class="abmod">${abMod(int(d.sb?.ab?.[k] ?? 10) || 10)}</span></label>`).join("")}</div>
    <div class="mgrid">${f("sv", "Saving throws", { ph: "Str +5, Con +5" })}${f("sk", "Skills", { ph: "Athletics +5" })}${f("se", "Senses", { ph: "Passive Perception 13" })}${f("la", "Languages", { ph: "Common" })}</div>
    <div class="mgrid">${f("re", "Resistances")}${f("im", "Immunities")}${f("ci", "Condition immunities")}${f("g", "Gear")}</div>
    <p class="hint">One entry per line, written as <b>Name. What it does.</b> For example: <i>Short Blade. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.</i></p>
    ${SB_SECTIONS.map(([k, label]) => fArea(mm, i, "sb." + k, label, { rows: k === "a" || k === "tr" ? 5 : 2 })).join("")}
    ${fArea(mm, i, "lore", "Lore", { rows: 5, ph: "Background, appearance, how they behave" })}
  </section>`;
}
function newCreature(fields) {
  const id = uid();
  putDoc("creatures", id, { title: "New creature", family: "", role: "", lore: "", sb: blankSb(), created: new Date().toISOString(), ...fields }, false);
  S.sel.bestiary = HB_PREFIX + id; S.best.q = ""; S.best.src = ""; S.hbEdit[id] = true;
  render();
  return id;
}
Object.assign(ACTIONS, {
  "hb-new": () => { newCreature({}); toast("New creature. Fill in its stat block, then click Done editing."); },
  "hb-edit": d => { S.hbEdit[d.id] = !S.hbEdit[d.id]; render(); },
  "hb-dup": d => { const o = S.mod.creatures.get(d.id); if (o) { newCreature({ ...structuredClone(o), id: undefined, title: (o.title || "Creature") + " (copy)" }); toast("Copied"); } },
  "hb-del": d => { S.confirm = null; const o = S.mod.creatures.get(d.id); delDoc("creatures", d.id); S.sel.bestiary = null; toast(`Deleted “${o?.title || "creature"}”`); },
  "hb-copy": d => { const m = MON.get(d.id); if (!m) return; newCreature({ title: m.n + " (homebrew)", sb: monToSb(m) }); toast(`Copied ${m.n}. Change anything you like.`); },
});
CHANGES["best-src"] = (d, el) => { S.best.src = el.value; renderModule(); };
