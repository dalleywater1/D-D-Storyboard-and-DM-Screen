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
