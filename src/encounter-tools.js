/* ===================== Encounter dice and stat blocks =====================
   On an encounter: a dice roller, and a ▸ on every monster (in the list and in
   the initiative tracker) that opens its stat block in place. Attack bonuses,
   damage dice and saving throws in those stat blocks are buttons that roll
   into the encounter's dice log (using its Advantage/Disadvantage setting). */
S.encSb = new Set(); S.encDice = {}; S.encDiceCfg = {};
const ENC_DICE = [4, 6, 8, 10, 12, 20, 100];

/* which stat block a monster row or tracker entry belongs to */
function monFor(c, x) {
  if (!x || x.pc) return null;
  let ref = x.srd ? { srd: x.srd } : x.npc ? { npc: x.npc } : null;
  if (!ref && c) {
    // combats started before rows remembered their creature: match "Goblin 2" to the "Goblin" row
    const nm = String(x.name || "");
    const mo = (c.monsters || []).find(m => m.name && (m.srd || m.npc) && (nm === m.name || nm.startsWith(m.name + " ")));
    if (mo) ref = mo.srd ? { srd: mo.srd } : { npc: mo.npc };
  }
  if (!ref) return null;
  if (ref.srd) return MON.get(ref.srd) || null;
  const card = S.cards.get(ref.npc);
  return card && card.sb ? sbToMon(card) : null;
}
function sbToggle(c, x, key) {
  const m = monFor(c, x); if (!m) return "";
  const open = S.encSb.has(c.id + "|" + key);
  return `<button type="button" class="icon-btn sb-tog" data-do="enc-sb" data-id="${esc(c.id)}" data-k="${esc(key)}" aria-expanded="${open}"
    aria-label="${open ? "Hide" : "Show"} stat block for ${esc(x.name || m.n)}" title="${open ? "Hide" : "Show"} stat block">${open ? "▾" : "▸"}</button>`;
}
function sbOpenBlock(c, x, key, kind) {
  if (!S.encSb.has(c.id + "|" + key)) return "";
  const m = monFor(c, x); if (!m) return "";
  const html = `<div class="enc-sb">${rollable(statBlock(m), c.id, x.name || m.n)}</div>`;
  return kind === "row" ? `<tr class="sb-row"><td colspan="7">${html}</td></tr>` : html;
}
/* turn "+5" after Attack Roll, "(1d6 + 3)" and "save +4" into roll buttons */
function rollable(html, encId, who) {
  const btn = (expr, label, what) => `<button type="button" class="rl" data-do="enc-roll" data-id="${esc(encId)}" data-expr="${expr}" data-who="${esc(who)}" data-what="${what}" title="Roll ${what}">${label}</button>`;
  const num = s => String(s).replace("−", "-").replace(/\s+/g, "");
  // damage dice only in the traits/actions sections, so "HP 10 (3d6)" stays plain
  const k = html.indexOf('class="sb-sec'), head = k < 0 ? html : html.slice(0, k), body = k < 0 ? "" : html.slice(k);
  return (head.replace(/save ([+−-]\d+)/g, (_, b) => "save " + btn("d20" + num(b), b, "save")) + body
    .replace(/(Attack Roll:(?:<\/i>)?\s*)([+−-]\d+)/g, (_, a, b) => a + btn("d20" + num(b), b, "attack"))
    .replace(/(\d+) \((\d+d\d+(?:\s*[+−-]\s*\d+)?)\)/g, (all, avg, e, at, str) => `${avg} (${btn(num(e), e, /(Failure|Success):[^.]*$/.test(str.slice(Math.max(0, at - 40), at)) ? "effect" : "damage")})`));
}
function rollExprFull(expr, mode) {
  const m = String(expr).match(/^(\d*)d(\d+)([+-]\d+)?$/); if (!m) return null;
  const n = Math.min(50, int(m[1]) || 1), die = int(m[2]), mod = int(m[3] || 0), r = () => 1 + Math.floor(Math.random() * die);
  if (die === 20 && n === 1 && (mode === "adv" || mode === "dis")) {
    const a = r(), b = r(), keep = mode === "adv" ? Math.max(a, b) : Math.min(a, b);
    return { total: keep + mod, nat: keep, text: `d20 ${mode} (${a}, ${b}) → ${keep}${mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : ""}` };
  }
  const rolls = Array.from({ length: n }, r), sum = rolls.reduce((s, x) => s + x, 0);
  return { total: sum + mod, nat: n === 1 ? rolls[0] : null, rolls, n, die, mod, text: `${n === 1 ? "" : n}d${die} (${rolls.join(", ")})${mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : ""}` };
}
function logRoll(encId, entry) { S.encDice[encId] = [entry, ...(S.encDice[encId] || [])].slice(0, 10); }
function encDice(c) {
  const i = c.id, cfg = S.encDiceCfg[i] || {}, log = S.encDice[i] || [], last = log[0];
  return `<div class="msec enc-dice" aria-label="Dice"><h3>Dice</h3>
    <div class="dice-ctl">
      <label class="mf"><span>Dice</span><input type="number" min="1" max="20" value="${esc(cfg.count || 1)}" data-encdice="count" data-id="${esc(i)}"></label>
      <label class="mf"><span>Modifier</span><input type="number" value="${esc(cfg.mod || 0)}" data-encdice="mod" data-id="${esc(i)}"></label>
      <label class="mf"><span>d20 rolls</span><select data-encdice="mode" data-id="${esc(i)}">${[["normal", "Normal"], ["adv", "Advantage"], ["dis", "Disadvantage"]].map(([v, l]) => `<option value="${v}" ${(cfg.mode || "normal") === v ? "selected" : ""}>${l}</option>`).join("")}</select></label>
    </div>
    <div class="dice-row">${ENC_DICE.map(n => `<button type="button" class="btn" data-do="enc-die" data-id="${esc(i)}" data-die="${n}">d${n}</button>`).join("")}</div>
    ${last ? `<div class="enc-last" aria-live="polite"><b class="dice-result">${last.total}</b><span>${last.html || esc(last.text)}</span></div>
      ${log.length > 1 ? `<ul class="dice-log">${log.slice(1).map(r => `<li>${r.html || esc(r.text)}</li>`).join("")}</ul>` : ""}`
      : `<p class="hint">Rolls show here and aren't saved. Open a creature's stat block with ▸ and click an attack bonus, damage dice or save to roll it.</p>`}
  </div>`;
}
Object.assign(ACTIONS, {
  "enc-sb": d => { const k = d.id + "|" + d.k; S.encSb.has(k) ? S.encSb.delete(k) : S.encSb.add(k); renderModule(); },
  "enc-die": d => {
    const cfg = S.encDiceCfg[d.id] || {}, count = clamp(int(cfg.count) || 1, 1, 20), mod = int(cfg.mod);
    const r = rollExprFull(`${count}d${d.die}${mod ? (mod > 0 ? "+" : "") + mod : ""}`, cfg.mode);
    logRoll(d.id, { total: r.total, text: `${r.text} = ${r.total}` });
    renderModule();
  },
  "enc-roll": d => {
    const cfg = S.encDiceCfg[d.id] || {}, what = d.what, who = d.who || "Creature";
    const r = rollExprFull(d.expr, what === "damage" || what === "effect" ? "normal" : cfg.mode); if (!r) return;
    let note = "";
    if ((what === "attack" || what === "save") && r.nat === 20) note = what === "attack" ? " · Natural 20: critical hit!" : " · Natural 20";
    if ((what === "attack" || what === "save") && r.nat === 1) note = what === "attack" ? " · Natural 1: miss" : " · Natural 1";
    let crit = "";
    if (what === "damage" && r.rolls && d.what !== "effect") { const extra = Array.from({ length: r.n }, () => 1 + Math.floor(Math.random() * r.die)); crit = ` · on a crit ${r.total + extra.reduce((s, x) => s + x, 0)}`; }
    const label = what === "attack" ? "attack" : what === "save" ? "save" : "damage";  // "effect" is save-based damage: no crit
    logRoll(d.id, { total: r.total, text: `${who} ${label}: ${r.text} = ${r.total}${note}${crit}`, html: `<b>${esc(who)}</b> ${label}: ${esc(r.text)} = <b>${r.total}</b>${esc(note)}${esc(crit)}` });
    toast(`${who} ${label}: ${r.total}${note}${crit}`);
    renderModule();
  },
});
document.addEventListener("input", e => { const el = e.target.closest?.("[data-encdice]"); if (el) (S.encDiceCfg[el.dataset.id] ||= {})[el.dataset.encdice] = el.value; });
document.addEventListener("change", e => { const el = e.target.closest?.("[data-encdice]"); if (el) (S.encDiceCfg[el.dataset.id] ||= {})[el.dataset.encdice] = el.value; });

/* ----- the active monster's abilities, shown under its row on its turn ----- */
S.turnCard = lsGet("sb-turncard", true);
function turnCard(c, x) {
  if (!S.turnCard || !x || x.pc) return "";
  if (S.encSb.has(c.id + "|run:" + x.id)) return "";   // its full stat block is already open
  const m = monFor(c, x); if (!m) return "";
  const entries = list => list.map(([n, d]) => `<div class="sb-entry"><b>${esc(n)}.</b> ${md(d).replace(/^<p>/, "").replace(/<\/p>$/, "")}</div>`).join("");
  const sec = (t, list) => list && list.length ? `<div class="sb-sec tc-sec"><h4>${t}</h4>${entries(list)}</div>` : "";
  const facts = [m.n !== x.name && !String(x.name).startsWith(m.n) ? m.n : "", `AC ${m.ac}`, `Speed ${m.sp}`, m.sv ? `Saves ${m.sv}` : "", m.re ? `Resists ${m.re}` : "", m.im || m.ci ? `Immune ${[m.im, m.ci].filter(Boolean).join("; ")}` : ""].filter(Boolean);
  const html = `<div class="turn-card" aria-label="${esc(x.name)}'s turn">
    <div class="tc-head"><b>${esc(x.name)}'s turn</b><span class="hint">${esc(facts.join(" · "))}</span></div>
    ${sec("Actions", m.a)}${sec("Bonus Actions", m.b)}${sec("Reactions", m.r)}${sec("Legendary Actions", m.l)}
    ${m.tr && m.tr.length ? `<details class="tc-traits"><summary>Traits (${m.tr.length})</summary><div class="sb-sec tc-sec">${entries(m.tr)}</div></details>` : ""}
  </div>`;
  return rollable(html, c.id, x.name);
}
function turnToggle() {
  return `<label class="tc-toggle"><input type="checkbox" data-turncard ${S.turnCard ? "checked" : ""}> Show abilities on their turn</label>`;
}
document.addEventListener("change", e => { if (e.target.matches?.("[data-turncard]")) { S.turnCard = e.target.checked; lsSet("sb-turncard", S.turnCard); renderModule(); } });

/* ===================== Creature cards bar (right of the encounter) =====================
   One card per creature type in the encounter, plus the party and the plan, so
   you can see everyone's abilities without leaving the page. Cards open and
   close; the one whose turn it is is highlighted and opened. The bar itself can
   be folded to a thin strip, and the encounter list on the left can be hidden. */
S.encSideOpen = lsGet("sb-encside", true);
S.combatListHidden = lsGet("sb-enclist-hidden", false);
S.encCards = new Set();          // "encId|key" of cards opened by hand
S.encCardsShut = new Set();      // the active creature's card closed by hand
const encKey = mo => mo.srd ? "srd:" + mo.srd : mo.npc ? "npc:" + mo.npc : "name:" + String(mo.name || "").toLowerCase();
function encCreatures(c) {
  const out = new Map();
  for (const mo of c.monsters || []) {
    if (!(mo.name || mo.srd || mo.npc)) continue;
    const k = encKey(mo), cur = out.get(k);
    if (cur) cur.count += Math.max(0, int(mo.count)); else out.set(k, { key: k, mo, count: Math.max(0, int(mo.count)), m: monFor(c, mo) });
  }
  return [...out.values()];
}
function copiesOf(c, cr) {
  if (!c.run) return [];
  return (c.run.list || []).filter(x => !x.pc && (cr.mo.srd ? x.srd === cr.mo.srd : cr.mo.npc ? x.npc === cr.mo.npc : false || String(x.name || "") === cr.mo.name || String(x.name || "").startsWith((cr.mo.name || "") + " ")));
}
function encCard(c, cr, activeKey) {
  const m = cr.m, mo = cr.mo, key = c.id + "|" + cr.key, turn = activeKey === cr.key;
  const open = S.encCards.has(key) || (turn && !S.encCardsShut.has(key));
  const name = m ? m.n : mo.name || "Monster";
  const facts = m ? [`AC ${m.ac}`, `HP ${m.hp}${m.hd ? ` (${m.hd})` : ""}`, `Speed ${m.sp}`, `Init ${m.init == null ? abMod(m.ab[1]) : m.init}`] : [`AC ${mo.ac || "—"}`, `HP ${mo.hp || "—"}`];
  const copies = copiesOf(c, cr);
  const entries = list => list.map(([n, d]) => `<div class="sb-entry"><b>${esc(n)}.</b> ${md(d).replace(/^<p>/, "").replace(/<\/p>$/, "")}</div>`).join("");
  const sec = (t, list) => list && list.length ? `<div class="sb-sec tc-sec"><h4>${t}</h4>${entries(list)}</div>` : "";
  let body = "";
  if (open && m) {
    const props = [m.sv && `<b>Saves</b> ${esc(m.sv)}`, m.sk && `<b>Skills</b> ${esc(m.sk)}`, m.se && `<b>Senses</b> ${esc(m.se)}`, m.re && `<b>Resist</b> ${esc(m.re)}`, m.vu && `<b>Vulnerable</b> ${esc(m.vu)}`, (m.im || m.ci) && `<b>Immune</b> ${esc([m.im, m.ci].filter(Boolean).join("; "))}`, m.la && `<b>Languages</b> ${esc(m.la)}`].filter(Boolean);
    body = rollable(`<div class="ec-body">${props.length ? `<div class="ec-props">${props.join("<br>")}</div>` : ""}
      ${sec("Traits", m.tr)}${sec("Actions", m.a)}${sec("Bonus Actions", m.b)}${sec("Reactions", m.r)}${sec("Legendary Actions", m.l)}
      <div class="ec-links">${mo.srd ? `<button type="button" class="btn ghost small" data-do="goto" data-tab="bestiary" data-id="${esc(mo.srd)}">Open in Bestiary</button>` : mo.npc ? `<button type="button" class="btn ghost small" data-do="goto" data-tab="npcs" data-id="${esc(mo.npc)}">Open NPC page</button>` : ""}</div></div>`, c.id, name);
  } else if (open) body = `<p class="hint ec-body">No stat block linked. Add this creature from the Bestiary to see its abilities here.</p>`;
  return `<article class="ecard${open ? " open" : ""}${turn ? " turn" : ""}" aria-label="${esc(name)}">
    <button type="button" class="ec-head" data-do="enc-card" data-id="${esc(c.id)}" data-k="${esc(cr.key)}" aria-expanded="${open}">
      <span class="ec-name">${turn ? `<span class="turn-tag">Turn</span>` : ""}${esc(name)}</span><span class="ec-n">${cr.count > 1 ? "×" + cr.count : ""}</span><span class="ec-cr mono">CR ${esc((m && m.cr) || mo.cr || "?")}</span><span class="ec-chev" aria-hidden="true">${open ? "▾" : "▸"}</span>
    </button>
    <div class="ec-facts">${esc(facts.join(" · "))}</div>
    ${m ? `<div class="ec-abil">${ABILS.map((a, k) => `<span><i>${a}</i> ${abMod(m.ab[k])}</span>`).join("")}</div>` : ""}
    ${copies.length ? `<div class="ec-copies">${copies.map(x => { const down = x.hp !== "" && x.hp != null && Number(x.hp) <= 0; return `<span class="ec-copy${down ? " down" : ""}${x.id === c.run.active ? " act" : ""}" title="${esc(x.name)}">${esc(String(x.name).replace(name, "").trim() || "#1")} <b>${esc(x.hp === "" || x.hp == null ? x.max || "—" : x.hp)}</b>/${esc(x.max || "—")}${(x.cond || []).length ? ` <i>${esc(x.cond.join(", "))}</i>` : ""}</span>`; }).join("")}</div>` : ""}
    ${body}
  </article>`;
}
function encSide(c) {
  if (!S.encSideOpen) return `<aside class="enc-side shut" aria-label="Creature cards"><button type="button" class="btn small enc-side-tog" data-do="enc-side" aria-expanded="false" title="Show creature cards">◂ Cards</button></aside>`;
  const crs = encCreatures(c);
  let activeKey = null;
  if (c.run) { const a = (c.run.list || []).find(x => x.id === c.run.active); if (a && !a.pc) { const hit = crs.find(cr => copiesOf(c, cr).some(x => x.id === a.id)); if (hit) activeKey = hit.key; } }
  const plan = String(c.tactics || "").trim();
  return `<aside class="enc-side" aria-label="Creature cards">
    <div class="enc-side-head"><h3>At a glance</h3><span class="actions">
      ${crs.length ? `<button type="button" class="btn ghost small" data-do="enc-cards-all" data-id="${esc(c.id)}">${crs.every(cr => S.encCards.has(c.id + "|" + cr.key)) ? "Close all" : "Open all"}</button>` : ""}
      <button type="button" class="btn ghost small" data-do="enc-side" aria-expanded="true" title="Fold the cards away">Hide ▸</button></span></div>
    ${plan ? `<details class="ec-plan" open><summary>Plan</summary><div>${md(plan)}</div></details>` : ""}
    <h4 class="ec-group">Party</h4>
    ${pcCards(c)}
    <h4 class="ec-group">Monsters</h4>
    ${crs.length ? crs.map(cr => encCard(c, cr, activeKey)).join("") : `<p class="hint">Add monsters to the encounter and their cards appear here.</p>`}
  </aside>`;
}
function combatListToggle() {
  return `<button type="button" class="btn ghost small enc-list-tog" data-do="enc-list" title="${S.combatListHidden ? "Show" : "Hide"} the list of encounters">${S.combatListHidden ? "▸ Show encounter list" : "◂ Hide encounter list"}</button>`;
}
Object.assign(ACTIONS, {
  "enc-card": d => {
    const k = d.id + "|" + d.k, c = S.mod.combats.get(d.id);
    const crs = c ? encCreatures(c) : [], open = document.querySelector(`.ecard .ec-head[data-k="${CSS.escape(d.k)}"]`)?.getAttribute("aria-expanded") === "true";
    if (open) { S.encCards.delete(k); S.encCardsShut.add(k); } else { S.encCards.add(k); S.encCardsShut.delete(k); }
    renderModule();
  },
  "enc-cards-all": d => {
    const c = S.mod.combats.get(d.id); if (!c) return;
    const keys = encCreatures(c).map(cr => d.id + "|" + cr.key), allOpen = keys.every(k => S.encCards.has(k));
    for (const k of keys) { if (allOpen) { S.encCards.delete(k); S.encCardsShut.add(k); } else { S.encCards.add(k); S.encCardsShut.delete(k); } }
    renderModule();
  },
  "enc-side": () => { S.encSideOpen = !S.encSideOpen; lsSet("sb-encside", S.encSideOpen); renderModule(); },
  "enc-list": () => { S.combatListHidden = !S.combatListHidden; lsSet("sb-enclist-hidden", S.combatListHidden); renderModule(); },
});

/* ----- player character cards: from the Guild tracker on the DM Screen ----- */
function pcCards(c) {
  const g = S.mod.screen.get("guild") || {}, rows = (g.party || []).map((p, r) => ({ p, r })).filter(({ p }) => p && (p.char || p.player));
  if (!rows.length) return `<p class="hint">Fill in your party on the DM Screen's Guild tracker and their cards appear here.</p>
    <div><button type="button" class="btn small" data-do="goto-tab" data-tab="screen">Open the DM Screen</button></div>`;
  const runList = c.run ? c.run.list || [] : [];
  return rows.map(({ p, r }) => {
    const name = p.char || p.player, key = c.id + "|pc:" + r;
    const inRun = runList.find(x => x.pc && x.name === name), turn = inRun && c.run.active === inRun.id;
    const open = S.encCards.has(key) || (turn && !S.encCardsShut.has(key));
    const facts = [p.cls && `${p.cls}${p.lvl ? " " + p.lvl : ""}`, `AC ${p.ac || "—"}`, `HP ${inRun ? `${inRun.hp === "" || inRun.hp == null ? p.hp || "—" : inRun.hp}/${p.hp || inRun.max || "—"}` : p.hp || "—"}`, p.pp && `PP ${p.pp}`].filter(Boolean);
    const down = inRun && inRun.hp !== "" && inRun.hp != null && Number(inRun.hp) <= 0;
    return `<article class="ecard pc${open ? " open" : ""}${turn ? " turn" : ""}${down ? " down" : ""}" aria-label="${esc(name)}">
      <button type="button" class="ec-head" data-do="enc-card" data-id="${esc(c.id)}" data-k="pc:${r}" aria-expanded="${open}">
        <span class="ec-name">${turn ? `<span class="turn-tag">Turn</span>` : ""}${esc(name)}</span>${p.player && p.char ? `<span class="ec-cr">${esc(p.player)}</span>` : ""}<span class="ec-chev" aria-hidden="true">${open ? "▾" : "▸"}</span>
      </button>
      <div class="ec-facts">${esc(facts.join(" · "))}</div>
      ${inRun && (inRun.cond || []).length ? `<div class="ec-copies"><span class="ec-copy"><i>${esc(inRun.cond.join(", "))}</i></span></div>` : ""}
      ${open ? `<div class="ec-body">
        <div class="mgrid ec-pcgrid">${fInput("screen", "guild", `party.${r}.cls`, "Class", { ph: "Fighter" })}${fInput("screen", "guild", `party.${r}.lvl`, "Level", { type: "number", min: 1, max: 20 })}
          ${fInput("screen", "guild", `party.${r}.ac`, "AC", { type: "number" })}${fInput("screen", "guild", `party.${r}.hp`, "HP", { type: "number" })}${fInput("screen", "guild", `party.${r}.pp`, "Passive Perc.", { type: "number" })}</div>
        ${fArea("screen", "guild", `party.${r}.notes`, "Abilities & notes", { rows: 4, ph: "Saves, spells, key features, what to watch for (e.g. Counterspell, Sentinel, Bless)" })}
      </div>` : (p.notes ? `<div class="ec-note">${esc(String(p.notes).split("\n")[0].slice(0, 110))}${String(p.notes).length > 110 || String(p.notes).includes("\n") ? "…" : ""}</div>` : "")}
    </article>`;
  }).join("");
}
