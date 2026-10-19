/* ===================== DM Screen =====================
   Ported from the "DM Screen 5.5e" sheets. Each panel is a module of its own:
   toggle them from the bar at the top of the tab. */
const SCREEN_PANELS = [
  { id: "conditions", title: "Conditions" },
  { id: "dying", title: "Dying, Concentration & Rest" },
  { id: "spells", title: "Spell Lookup" },
  { id: "actions", title: "Actions" },
  { id: "cover", title: "Cover & Weapon Mastery" },
  { id: "encounters", title: "Encounter Building" },
  { id: "dcs", title: "DCs, Travel & Hazards" },
  { id: "guild", title: "Guild Tracker", gm: true },
];
const cond = (name, items, extra = "") => `<div class="cond"><h3>${name}</h3><ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>${extra}</div>`;
const SCREEN_STATIC = {
  conditions: () => `<h2>Conditions</h2>
    <div class="flow">    ${cond("Blinded", ["Can't see; auto-fail checks that need sight.", "Attacks against it have advantage; its attacks have disadvantage."])}
    ${cond("Charmed", ["Can't attack the charmer or target it with damaging abilities or magic.", "Charmer has advantage on social checks against it."])}
    ${cond("Deafened", ["Can't hear; auto-fail checks that need hearing."])}
    ${cond("Exhaustion", ["Cumulative levels 1–6. D20 Tests −2 × level; Speed −5 ft × level.", "Long rest removes 1 level. Level 6: the creature dies."],
      `<div class="exh" aria-label="Exhaustion levels: D20 Test penalty and Speed penalty">${[1, 2, 3, 4, 5].map(n => `<div><b>${n}</b><br>−${2 * n} / −${5 * n}</div>`).join("")}<div><b>6</b><br>Dead</div></div>`)}
    ${cond("Frightened", ["Disadvantage on ability checks and attacks while the source is in sight.", "Can't willingly move closer to the source."])}
    ${cond("Grappled", ["Speed 0; can't increase.", "Disadvantage on attacks against anyone but the grappler.", "Grappler can move it (extra movement cost unless it's Tiny or 2+ sizes smaller).", "Escape: action, Athletics or Acrobatics vs. the grapple DC."])}
    ${cond("Incapacitated", ["No actions, bonus actions or reactions.", "Concentration ends; can't speak.", "Disadvantage on Initiative if incapacitated when rolled."])}
    ${cond("Invisible", ["Advantage on Initiative.", "Unaffected by effects that need sight of it, unless the source can see it.", "Attacks against it have disadvantage; its attacks have advantage (unless seen)."])}
    ${cond("Paralyzed", ["Incapacitated; Speed 0.", "Auto-fail Str and Dex saves.", "Attacks against it have advantage.", "Any hit from within 5 ft is a Critical Hit."])}
    ${cond("Petrified", ["Turned to stone (×10 weight), stops aging.", "Incapacitated; Speed 0.", "Attacks against it have advantage; auto-fail Str and Dex saves.", "Resistance to all damage; immune to Poisoned."])}
    ${cond("Poisoned", ["Disadvantage on attack rolls and ability checks."])}
    ${cond("Prone", ["Moves only by crawling, or spend half Speed to stand.", "Disadvantage on its attacks.", "Attacks against it: advantage within 5 ft, otherwise disadvantage."])}
    ${cond("Restrained", ["Speed 0.", "Attacks against it have advantage; its attacks have disadvantage.", "Disadvantage on Dex saves."])}
    ${cond("Stunned", ["Incapacitated.", "Auto-fail Str and Dex saves.", "Attacks against it have advantage."])}
    ${cond("Unconscious", ["Incapacitated and Prone; drops what it holds; unaware of surroundings.", "Speed 0; auto-fail Str and Dex saves.", "Attacks against it have advantage.", "Any hit from within 5 ft is a Critical Hit."])}</div>
    <p class="foot-note"><b>D20 Test</b> = any attack roll, ability check or saving throw. Advantage and disadvantage don't stack; one of each cancels.</p>`,
  dying: () => `<h2>Dying, Concentration &amp; Rest</h2>
    <div class="adv-box"><h3>Death Saving Throws</h3><ul class="tight">
      <li>At 0 HP, roll d20 at the start of each turn. <b>10+</b> success, <b>9−</b> failure.</li>
      <li><b>3 successes:</b> Stable. <b>3 failures:</b> dead.</li>
      <li><b>Natural 20:</b> regain 1 HP. <b>Natural 1:</b> two failures.</li></ul></div>
    <div><h3>At 0 Hit Points</h3><ul class="tight">
      <li>Damage while at 0 HP = 1 failure (Critical Hit = 2).</li>
      <li><b>Instant death</b> if leftover damage ≥ HP maximum.</li>
      <li><b>Stabilize:</b> DC 10 Wis (Medicine) as an action, or any healing.</li>
      <li>A Stable creature regains 1 HP after 1d4 hours.</li></ul></div>
    <div><h3>Concentration</h3><p>On taking damage: Con save, DC 10 or half the damage (max DC 30). Ends if Incapacitated or you die.</p></div>
    <div><h3>Resting</h3><p><b>Short</b> (1 hr): spend Hit Dice. <b>Long</b> (8 hrs): all HP and Hit Dice back, −1 Exhaustion.</p></div>`,
  actions: () => `<h2>Actions</h2><div class="kv">
    ${[["Attack", "Make an attack with a weapon or an Unarmed Strike."], ["Dash", "Gain extra movement equal to your Speed."], ["Disengage", "Your movement provokes no Opportunity Attacks this turn."],
      ["Dodge", "Attacks vs. you have disadvantage; advantage on Dex saves. Lost if Incapacitated or Speed 0."], ["Help", "Give an ally advantage on a check, or on their next attack vs. a foe within 5 ft of you."],
      ["Hide", "DC 15 Dex (Stealth) while Heavily Obscured or behind ¾+ cover, out of sight. Success: Invisible."], ["Influence", "Cha or Wis check to change a creature's attitude."],
      ["Magic", "Cast a spell, use a magic item or a magical feature."], ["Ready", "Set a trigger and a response; uses your Reaction."], ["Search", "Wis check: Insight, Medicine, Perception or Survival."],
      ["Study", "Int check: Arcana, History, Investigation, Nature or Religion."], ["Utilize", "Use a nonmagical object."]].map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join("")}</div>`,
  cover: () => `<h2>Cover &amp; Weapon Mastery</h2>
    <div class="kv"><b>Half</b><span>+2 AC and Dex saves</span><b>¾</b><span>+5 AC and Dex saves</span><b>Total</b><span>Can't be targeted directly</span></div>
    <div><h3>Opportunity Attack</h3><p>Reaction when a creature you can see leaves your reach: one melee attack.</p></div>
    <div><h3>Weapon Mastery</h3><div class="kv">
    ${[["Cleave", "On hit, attack a second foe within 5 ft (no mod to damage). 1/turn."], ["Graze", "On miss, deal damage equal to your ability mod."], ["Nick", "Light extra attack is part of the Attack action. 1/turn."],
      ["Push", "Push a Large or smaller target 10 ft."], ["Sap", "Target has disadvantage on its next attack."], ["Slow", "Target's Speed −10 ft until your next turn."],
      ["Topple", "Con save (8 + mod + PB) or Prone."], ["Vex", "Advantage on your next attack vs. that target."]].map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join("")}</div></div>`,
  encounters: () => `<h2>Encounter Building</h2>
    <div><h3>XP budget per character</h3>
    <table class="rt"><thead><tr><th>Lvl</th><th class="num">Low</th><th class="num">Moderate</th><th class="num">High</th></tr></thead><tbody>
    ${Object.entries(XP_BUDGET).map(([l, b]) => `<tr><td>${l}</td><td class="num">${fmtN(b[0])}</td><td class="num">${fmtN(b[1])}</td><td class="num">${fmtN(b[2])}</td></tr>`).join("")}
    </tbody></table><p class="foot-note">Multiply by party size, then spend it on monsters by XP. The Combats tab does the sums for you.</p></div>
    <div><h3>XP by Challenge Rating</h3><div class="crgrid">${CRS.slice(1, 25).map(cr => `<span><b>${cr}</b> · ${fmtN(CR_XP[cr])}</span>`).join("")}</div></div>
    ${S.canGM ? `<div><button type="button" class="btn" data-do="goto-tab" data-tab="combats">Open Combats</button></div>` : ""}`,
  dcs: () => `<h2>DCs, Travel &amp; Hazards</h2>
    <table class="rt"><thead><tr><th>Task</th><th class="num">DC</th></tr></thead><tbody>
      ${[["Very easy", 5], ["Easy", 10], ["Medium", 15], ["Hard", 20], ["Very hard", 25], ["Nearly impossible", 30]].map(([k, v]) => `<tr><td>${k}</td><td class="num"><b>${v}</b></td></tr>`).join("")}</tbody></table>
    <div><h3>Travel pace</h3><table class="rt"><thead><tr><th>Pace</th><th>Hour / Day</th><th>Effect</th></tr></thead><tbody>
      <tr><td>Fast</td><td>4 / 30 mi</td><td>Disadv. Perception &amp; Survival</td></tr>
      <tr><td>Normal</td><td>3 / 24 mi</td><td>Disadv. Stealth</td></tr>
      <tr><td>Slow</td><td>2 / 18 mi</td><td>Adv. Perception &amp; Survival</td></tr></tbody></table></div>
    <div><h3>Improvised damage</h3><table class="rt"><tbody>
      <tr><td><b>1d10</b></td><td>Hot coals, falling shelf</td></tr><tr><td><b>2d10</b></td><td>Lightning strike, fire pit</td></tr>
      <tr><td><b>4d10</b></td><td>Tunnel collapse, acid vat</td></tr><tr><td><b>10d10</b></td><td>Crushing walls, lava stream</td></tr>
      <tr><td><b>18d10</b></td><td>Submerged in lava</td></tr></tbody></table></div>
    <div><h3>Traps &amp; hazards</h3><table class="rt"><thead><tr><th>Severity</th><th>Save DC</th><th>Attack</th></tr></thead><tbody>
      <tr><td>Setback</td><td>10–11</td><td>+3 to +5</td></tr><tr><td>Dangerous</td><td>12–15</td><td>+6 to +8</td></tr><tr><td>Deadly</td><td>16–20</td><td>+9 to +12</td></tr></tbody></table></div>
    <p><b>Falling:</b> 1d6 per 10 ft (max 20d6), land Prone.<br><b>Object AC:</b> cloth 11 · glass 13 · wood 15 · stone 17 · iron 19 · adamantine 23.</p>`,
};
const SPELL_LEVELS = [["all", "All"], [0, "Cantrip"], [1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [5, "5th"], [6, "6th"]];
function spellPanel() {
  const q = S.spell.q.trim().toLowerCase(), lvl = S.spell.lvl;
  const res = SPELLS.filter(s => (lvl === "all" || s.l === lvl) && (!q || (s.n + " " + s.s + " " + s.x).toLowerCase().includes(q)))
    .sort((a, b) => a.l - b.l || a.n.localeCompare(b.n));
  return `<h2>Spell Lookup</h2>
    <input id="spell-q" class="spell-search" type="search" data-q="spell" placeholder="Search name, school or effect: fireball, heal, paralyzed" aria-label="Search spells" value="${esc(S.spell.q)}">
    <div class="lvl-row" role="group" aria-label="Spell level">${SPELL_LEVELS.map(([v, l]) => `<button type="button" class="chip" data-do="spell-lvl" data-lvl="${v}" aria-pressed="${v === lvl}">${l}</button>`).join("")}<span class="count">${res.length} spell${res.length === 1 ? "" : "s"}</span></div>
    <div class="spell-list" data-keep-scroll="spells">${res.length ? res.map(s => `<div class="spell">
      <div class="sn"><b>${esc(s.n)}</b><span class="meta">${s.l === 0 ? "Cantrip" : "Level " + s.l} · ${esc(s.s)}</span>${s.k ? pill("Concentration", "muted") : ""}</div>
      <div class="meta"><b>Cast</b> ${esc(s.t)} · <b>Range</b> ${esc(s.r)} · <b>Comp.</b> ${esc(s.c)} · <b>Duration</b> ${esc(s.d)}</div>
      <div>${esc(s.x)}</div></div>`).join("") : `<p class="hint" style="padding:16px 0">No spell matches. Try a shorter word.</p>`}</div>
    <p class="foot-note">Quick summaries of common spells. Check the full spell text for edge cases and upcasting.</p>`;
}
/* ----- Guild tracker: a pane of sections you can add, remove, rename and reorder.
   Stored in screen/guild: secs = [{id, kind, legacy?}] in order, sd.<id> = each
   section's own data. Older trackers (no secs yet) get the default list, which
   reads the original fields (party, adventure, traps, artifacts, notes), so
   nothing filled in before is lost. ----- */
const XP_LEVELS = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
const xpLevel = xp => { let l = 1; while (l < 20 && xp >= XP_LEVELS[l]) l++; return l; };
const G_KINDS = [
  { kind: "party", title: "The party", blurb: "Players, characters, class, level, AC, HP. Combats uses it.", one: true },
  { kind: "xp", title: "Experience", blurb: "XP each character has earned, with a log of awards and the next level.", one: true },
  { kind: "adventure", title: "Current adventure", blurb: "Adventure, goal, and a favour track with what pleases and angers.", one: true },
  { kind: "checklist", title: "Checklist", blurb: "Objectives, clues, quests or traps to tick off." },
  { kind: "track", title: "Track", blurb: "A row of pips: reputation, alarm, a countdown." },
  { kind: "counters", title: "Counters", blurb: "Named numbers with − and +: gold, renown, rations." },
  { kind: "notes", title: "Notes", blurb: "A free-text box." },
];
const G_TITLES = { traps: "The eight traps", artifacts: "Recovered artifacts", notes: "Session notes" };
S.guildEdit = false; S.guildAdd = false;
const gDoc = () => S.mod.screen.get("guild") || {};
function guildSecs() {
  const g = gDoc(); if (Array.isArray(g.secs)) return g.secs;
  const trapData = (g.traps || []).some(t => t && (t.name || t.desc || t.done));
  return [{ id: "party", kind: "party" }, { id: "xp", kind: "xp" }, { id: "adventure", kind: "adventure" },
    trapData ? { id: "traps", kind: "checklist", legacy: "traps" } : { id: "objectives", kind: "checklist" },
    { id: "artifacts", kind: "notes", legacy: "artifacts" }, { id: "notes", kind: "notes", legacy: "notes" }];
}
const gTitle = sec => val("screen", "guild", `sd.${sec.id}.title`, "") || G_TITLES[sec.legacy] || (sec.id === "objectives" ? "Objectives" : G_KINDS.find(k => k.kind === sec.kind)?.title || "Section");
const gArr = x => Array.isArray(x) ? x : x && typeof x === "object" ? Object.keys(x).filter(k => /^\d+$/.test(k)).reduce((a, k) => (a[k] = x[k], a), []) : [];
const gItemsPath = sec => sec.legacy && sec.kind === "checklist" ? sec.legacy : `sd.${sec.id}.items`;
const gTextPath = sec => sec.legacy && sec.kind === "notes" ? sec.legacy : `sd.${sec.id}.text`;
function gSaveSecs(secs) { const g = docCopy("screen", "guild"); g.secs = secs; putDoc("screen", "guild", g); }
const paneName = () => (gDoc().paneName || "").trim() || "Guild Tracker";

function gParty(sec) {
  const m = "screen", i = "guild", rows = clamp(int(val(m, i, "partyRows", 6)) || 6, 1, 10);
  return `<div class="mtable-wrap"><table class="mt"><thead><tr><th>Player</th><th>Character</th><th>Class</th><th class="num">Lvl</th><th class="num">AC</th><th class="num">HP</th><th class="num">PP</th></tr></thead><tbody>
      ${Array.from({ length: rows }, (_, r) => `<tr>
        <td>${fInput(m, i, `party.${r}.player`, null, { aria: `Player ${r + 1}` })}</td>
        <td>${fInput(m, i, `party.${r}.char`, null, { aria: `Character ${r + 1}` })}</td>
        <td>${fInput(m, i, `party.${r}.cls`, null, { aria: `Class ${r + 1}` })}</td>
        <td class="num" style="width:52px">${fInput(m, i, `party.${r}.lvl`, null, { type: "number", min: 1, max: 20, aria: `Level ${r + 1}` })}</td>
        <td class="num" style="width:52px">${fInput(m, i, `party.${r}.ac`, null, { type: "number", aria: `AC ${r + 1}` })}</td>
        <td class="num" style="width:60px">${fInput(m, i, `party.${r}.hp`, null, { type: "number", aria: `HP ${r + 1}` })}</td>
        <td class="num" style="width:52px">${fInput(m, i, `party.${r}.pp`, null, { type: "number", aria: `Passive Perception ${r + 1}` })}</td></tr>`).join("")}
    </tbody></table></div><p class="hint">PP = passive Perception. Combats and the encounter cards use this party.</p>`;
}
function gXp(sec) {
  const m = "screen", i = "guild", d = gDoc().sd?.[sec.id] || {}, log = d.log || [];
  const xp = int(d.start) + log.reduce((a, x) => a + int(x.amt), 0), lvl = xpLevel(xp);
  const next = lvl < 20 ? XP_LEVELS[lvl] : null, from = XP_LEVELS[lvl - 1];
  const pct = next ? Math.round(100 * (xp - from) / (next - from)) : 100;
  const party = guildParty(), size = party.length;
  const lvls = party.map(p => int(p.lvl)).filter(Boolean), low = lvls.length ? Math.min(...lvls) : 0;
  const combats = sortedCombats().filter(c => encStats(c).total);
  return `<div class="g-xp">
      <div class="g-xp-head"><span class="g-xp-num">${fmtN(xp)}</span><span>XP each</span>${pill("Level " + lvl, "muted")}${low && lvl > low ? pill(`Level up: ${low} → ${lvl}`, "good") : ""}</div>
      <div class="g-bar" role="progressbar" aria-label="Progress to level ${next ? lvl + 1 : 20}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
      <p class="hint" style="margin:0">${next ? `${fmtN(next - xp)} XP to level ${lvl + 1} (${fmtN(next)}).` : "Level 20: the top of the table."}</p>
      ${S.canWrite ? `<div class="add-row g-award">
        <input id="g-xp-amt-${sec.id}" class="short" type="number" min="0" placeholder="XP" aria-label="XP to award">
        <select id="g-xp-how-${sec.id}" aria-label="How the XP is given"><option value="each">each</option><option value="split">split ${size || "?"} ways</option></select>
        <input id="g-xp-note-${sec.id}" placeholder="For what: cleared the bandit camp" aria-label="What the XP is for">
        <button type="button" class="btn primary" data-do="g-xp-add" data-sec="${sec.id}">Award</button></div>
        ${combats.length ? `<label class="mf"><span>Or from an encounter</span><select data-change="g-xp-enc" data-sec="${sec.id}" aria-label="Fill in the XP from an encounter"><option value="">Choose an encounter…</option>${combats.map(c => `<option value="${esc(c.id)}">${esc(c.title || "Untitled encounter")} · ${fmtN(encStats(c).total)} XP</option>`).join("")}</select></label>` : ""}` : ""}
      ${log.length ? `<ul class="g-log">${log.map((x, n) => ({ x, n })).reverse().map(({ x, n }) => `<li><b>+${fmtN(int(x.amt))}</b><span>${esc(x.note || "XP")}</span>${x.split ? `<span class="hint">${fmtN(x.split)} split ${x.ways} ways</span>` : ""}${S.canWrite ? `<button type="button" class="icon-btn" data-do="g-xp-del" data-sec="${sec.id}" data-n="${n}" aria-label="Remove this award">×</button>` : ""}</li>`).join("")}</ul>` : `<p class="hint" style="margin:0">No XP awarded yet.</p>`}
      ${S.guildEdit ? `<div class="mgrid">${fInput(m, i, `sd.${sec.id}.start`, "Starting XP", { type: "number", min: 0, ph: "0", hint: "before the log" })}</div>` : ""}
    </div>`;
}
function gAdventure() {
  const m = "screen", i = "guild", favor = int(val(m, i, "favor", 0)), track = val(m, i, "track", "") || "Favor";
  return `<div class="adv-box">
      <div class="mgrid">${fInput(m, i, "adventure", "Current adventure", { ph: "The Sunken Library", wide: true })}${fInput(m, i, "goal", "Goal", { ph: "Find the lost key before the tide turns", wide: true })}</div>
      <div class="row-between"><div class="mgrid" style="flex:1">${fInput(m, i, "track", "Track", { ph: "Favour with the Duke" })}</div>
        <div class="favor" role="group" aria-label="${esc(track)}: ${favor} of 10">${Array.from({ length: 10 }, (_, k) => `<button type="button" data-do="favor" data-n="${k + 1}" aria-pressed="${k < favor}" aria-label="${esc(track)} ${k + 1} of 10"></button>`).join("")}</div></div>
      <div class="mgrid">${fArea(m, i, "pleases", "Pleases", { rows: 2 })}${fArea(m, i, "angers", "Angers", { rows: 2 })}</div></div>`;
}
function gChecklist(sec) {
  const m = "screen", i = "guild", ip = gItemsPath(sec), items = gArr(getPath(gDoc(), ip)), t = gTitle(sec);
  return `${items.map((_, n) => `<div class="trap g-row ${val(m, i, `${ip}.${n}.done`, false) ? "done" : ""}">
      ${fCheck(m, i, `${ip}.${n}.done`, `${t} ${n + 1} done`)}
      ${fInput(m, i, `${ip}.${n}.name`, null, { aria: `${t} ${n + 1}`, ph: `${n + 1} ·`, cls: "tname" })}
      ${S.canWrite ? `<button type="button" class="icon-btn g-x" data-do="g-item-del" data-sec="${sec.id}" data-n="${n}" aria-label="Remove ${esc(t)} ${n + 1}">×</button>` : ""}
      ${fInput(m, i, `${ip}.${n}.desc`, null, { aria: `${t} ${n + 1} notes`, ph: "Notes", cls: "tdesc" })}</div>`).join("")}
    ${!items.length ? `<p class="hint" style="margin:0">Nothing on the list yet.</p>` : ""}
    ${S.canWrite ? `<div><button type="button" class="btn small" data-do="g-item-add" data-sec="${sec.id}">+ Add</button></div>` : ""}`;
}
function gTrack(sec) {
  const m = "screen", i = "guild", d = gDoc().sd?.[sec.id] || {}, max = clamp(int(d.max) || 10, 2, 30), n = clamp(int(d.n), 0, max), t = gTitle(sec);
  return `<div class="row-between"><div class="favor" role="group" aria-label="${esc(t)}: ${n} of ${max}">${Array.from({ length: max }, (_, k) => `<button type="button" data-do="g-pip" data-sec="${sec.id}" data-n="${k + 1}" aria-pressed="${k < n}" aria-label="${esc(t)} ${k + 1} of ${max}"></button>`).join("")}</div><span class="mono hint">${n} / ${max}</span></div>
    ${S.guildEdit ? `<div class="mgrid">${fInput(m, i, `sd.${sec.id}.max`, "Pips", { type: "number", min: 2, max: 30, ph: "10" })}</div>` : ""}
    <div class="mgrid">${fArea(m, i, `sd.${sec.id}.up`, "Raises it", { rows: 2 })}${fArea(m, i, `sd.${sec.id}.down`, "Lowers it", { rows: 2 })}</div>`;
}
function gCounters(sec) {
  const m = "screen", i = "guild", ip = gItemsPath(sec), items = gArr(getPath(gDoc(), ip)), t = gTitle(sec);
  return `${items.length ? `<div class="g-counters">${items.map((it, n) => `<div class="g-counter">
      ${fInput(m, i, `${ip}.${n}.name`, null, { aria: `${t}: name ${n + 1}`, ph: "Gold", cls: "g-cname" })}
      ${S.canWrite ? `<button type="button" class="btn small" data-do="g-count" data-sec="${sec.id}" data-n="${n}" data-d="-1" aria-label="One less">−</button>` : ""}
      ${fInput(m, i, `${ip}.${n}.n`, null, { type: "number", aria: `${it?.name || "Counter " + (n + 1)} amount`, ph: "0", cls: "g-cnum" })}
      ${S.canWrite ? `<button type="button" class="btn small" data-do="g-count" data-sec="${sec.id}" data-n="${n}" data-d="1" aria-label="One more">+</button>
      <button type="button" class="icon-btn" data-do="g-item-del" data-sec="${sec.id}" data-n="${n}" aria-label="Remove ${esc(it?.name || "counter")}">×</button>` : ""}</div>`).join("")}</div>` : `<p class="hint" style="margin:0">No counters yet.</p>`}
    ${S.canWrite ? `<div><button type="button" class="btn small" data-do="g-item-add" data-sec="${sec.id}">+ Add counter</button></div>` : ""}`;
}
function gNotes(sec) { return fArea("screen", "guild", gTextPath(sec), null, { rows: sec.legacy === "artifacts" ? 3 : 4, aria: gTitle(sec) }); }
const G_RENDER = { party: gParty, xp: gXp, adventure: gAdventure, checklist: gChecklist, track: gTrack, counters: gCounters, notes: gNotes };

function guildPanel() {
  const m = "screen", i = "guild", secs = guildSecs(), ed = S.guildEdit && S.canWrite;
  const have = new Set(secs.map(s => s.kind));
  return `<div class="ptitle">${fInput(m, i, "title", null, { aria: "Tracker title", ph: "Your party or guild" })}</div>
    ${S.canWrite ? `<div class="g-tools">${ed ? `<button type="button" class="btn small" data-do="g-add-open" aria-expanded="${S.guildAdd}">+ Add section</button>` : ""}<button type="button" class="btn ${ed ? "primary" : "ghost"} small" data-do="g-edit" aria-pressed="${ed}">${ed ? "Done" : "Edit sections"}</button></div>` : ""}
    ${ed ? `<div class="g-edit-box"><div class="mgrid">${fInput(m, i, "paneName", "Pane name", { ph: "Guild Tracker", hint: "on the panels bar" })}${have.has("party") ? fSelect(m, i, "partyRows", "Party rows", [4, 5, 6, 7, 8, 9, 10].map(n => [n]), { dflt: "6" }) : ""}</div>
      ${S.guildAdd ? `<div class="panel-chooser g-chooser">${G_KINDS.map(k => { const off = k.one && have.has(k.kind);
        return `<button type="button" class="panel-choice" data-do="g-add" data-kind="${k.kind}" ${off ? "disabled" : ""}><b>${k.title}</b><span>${off ? "Already in the pane." : k.blurb}</span></button>`; }).join("")}</div>` : ""}</div>` : ""}
    ${secs.map((sec, n) => `<div class="msec g-sec" id="gsec-${esc(sec.id)}">
      <div class="g-sec-head">${ed ? fInput(m, i, `sd.${sec.id}.title`, null, { aria: "Section title", ph: gTitle(sec), cls: "g-title-in" }) : `<h3>${esc(gTitle(sec))}</h3>`}
        ${ed ? `<span class="g-sec-ctl">
          <button type="button" class="icon-btn" data-do="g-move" data-sec="${esc(sec.id)}" data-dir="-1" ${n === 0 ? "disabled" : ""} aria-label="Move ${esc(gTitle(sec))} up">↑</button>
          <button type="button" class="icon-btn" data-do="g-move" data-sec="${esc(sec.id)}" data-dir="1" ${n === secs.length - 1 ? "disabled" : ""} aria-label="Move ${esc(gTitle(sec))} down">↓</button>
          ${S.confirm === "gsec" + sec.id ? `<span class="confirm">${sec.legacy || G_KINDS.find(k => k.kind === sec.kind)?.one ? "Take it out? What's in it stays saved." : "Remove it and what's in it?"} <button type="button" class="btn danger small" data-do="g-del" data-sec="${esc(sec.id)}">Remove</button><button type="button" class="btn small" data-do="cancel">Keep</button></span>`
            : `<button type="button" class="icon-btn" data-do="ask" data-key="gsec${esc(sec.id)}" aria-label="Remove ${esc(gTitle(sec))}">×</button>`}</span>` : ""}</div>
      ${(G_RENDER[sec.kind] || gNotes)(sec)}</div>`).join("")}
    ${!secs.length ? `<p class="hint">No sections. Click Edit sections → Add section.</p>` : ""}`;
}
/* the pane's name on the panels bar */
const _allPanelsG = allPanels;
allPanels = function () { return _allPanelsG().map(p => p.id === "guild" ? { ...p, title: paneName() } : p); };
function gSec(id) { return guildSecs().find(s => s.id === id); }
Object.assign(ACTIONS, {
  "g-edit": () => { S.guildEdit = !S.guildEdit; S.guildAdd = false; S.confirm = null; render(); },
  "g-add-open": () => { S.guildAdd = !S.guildAdd; render(); },
  "g-add": d => {
    const k = G_KINDS.find(x => x.kind === d.kind); if (!k) return;
    const secs = [...guildSecs()];
    // the one-off kinds keep a fixed id, so taking one out and back brings its contents back
    const id = k.one ? d.kind : d.kind + "_" + uid();
    if (secs.some(s => s.id === id)) return;
    secs.push(k.kind === "notes" && id === "notes" ? { id, kind: "notes", legacy: "notes" } : { id, kind: k.kind });
    S.guildAdd = false; gSaveSecs(secs); toast(`Added ${k.title}`);
    setTimeout(() => { const el = document.getElementById("gsec-" + id); el?.scrollIntoView({ block: "nearest", behavior: "smooth" }); el?.querySelector("input")?.focus(); }, 60);
  },
  "g-move": d => {
    const secs = [...guildSecs()], n = secs.findIndex(s => s.id === d.sec), j = n + Number(d.dir);
    if (n < 0 || j < 0 || j >= secs.length) return;
    [secs[n], secs[j]] = [secs[j], secs[n]]; gSaveSecs(secs);
    setTimeout(() => document.querySelector(`#gsec-${CSS.escape(d.sec)} [data-dir="${d.dir}"]`)?.focus(), 30);
  },
  "g-del": d => {
    S.confirm = null;
    const sec = gSec(d.sec), g = docCopy("screen", "guild");
    g.secs = guildSecs().filter(s => s.id !== d.sec);
    const keep = sec && (sec.legacy || G_KINDS.find(k => k.kind === sec.kind)?.one);
    if (!keep && g.sd) delete g.sd[d.sec];
    putDoc("screen", "guild", g); toast("Section removed");
  },
  "g-item-add": d => {
    const sec = gSec(d.sec); if (!sec) return;
    const g = docCopy("screen", "guild"), ip = gItemsPath(sec), items = [...gArr(getPath(g, ip))];
    items.push(sec.kind === "counters" ? { name: "", n: 0 } : { name: "", desc: "", done: false });
    setPath(g, ip, items); putDoc("screen", "guild", g);
    setTimeout(() => { const rows = document.querySelectorAll(`#gsec-${CSS.escape(d.sec)} ${sec.kind === "counters" ? ".g-cname" : ".tname"}`); rows[rows.length - 1]?.focus(); }, 40);
  },
  "g-item-del": d => {
    const sec = gSec(d.sec); if (!sec) return;
    const g = docCopy("screen", "guild"), ip = gItemsPath(sec), items = [...gArr(getPath(g, ip))];
    items.splice(Number(d.n), 1); setPath(g, ip, items); putDoc("screen", "guild", g);
  },
  "g-count": d => {
    const sec = gSec(d.sec); if (!sec) return;
    const p = `${gItemsPath(sec)}.${d.n}.n`;
    commit("screen", "guild", p, int(val("screen", "guild", p, 0)) + Number(d.d)); render();
  },
  "g-pip": d => {
    const p = `sd.${d.sec}.n`, cur = int(val("screen", "guild", p, 0)), n = Number(d.n);
    commit("screen", "guild", p, cur === n ? n - 1 : n); render();
  },
  "g-xp-add": d => {
    const amtEl = $(`#g-xp-amt-${d.sec}`), raw = Math.max(0, int(amtEl?.value)); if (!raw) { amtEl?.focus(); return; }
    const how = $(`#g-xp-how-${d.sec}`)?.value, ways = guildParty().length || 1, note = ($(`#g-xp-note-${d.sec}`)?.value || "").trim();
    const entry = how === "split" ? { amt: Math.floor(raw / ways), split: raw, ways, note } : { amt: raw, note };
    entry.date = new Date().toISOString().slice(0, 10);
    const g = docCopy("screen", "guild"), before = xpLevel(int(g.sd?.[d.sec]?.start) + (g.sd?.[d.sec]?.log || []).reduce((a, x) => a + int(x.amt), 0));
    setPath(g, `sd.${d.sec}.log`, [...(g.sd?.[d.sec]?.log || []), entry]); putDoc("screen", "guild", g);
    const after = xpLevel(int(g.sd[d.sec].start) + g.sd[d.sec].log.reduce((a, x) => a + int(x.amt), 0));
    toast(after > before ? `+${fmtN(entry.amt)} XP each. That's level ${after}!` : `+${fmtN(entry.amt)} XP each`);
  },
  "g-xp-del": d => {
    const g = docCopy("screen", "guild"), log = [...(g.sd?.[d.sec]?.log || [])];
    log.splice(Number(d.n), 1); setPath(g, `sd.${d.sec}.log`, log); putDoc("screen", "guild", g);
  },
});
CHANGES["g-xp-enc"] = (d, el) => {
  const c = S.mod.combats.get(el.value); if (!c) return;
  const amt = $(`#g-xp-amt-${d.sec}`), how = $(`#g-xp-how-${d.sec}`), note = $(`#g-xp-note-${d.sec}`);
  if (amt) amt.value = encStats(c).total; if (how) how.value = "split"; if (note && !note.value) note.value = c.title || "Encounter";
  el.value = ""; $(`#g-xp-amt-${d.sec}`)?.focus();
};
/* ----- panels you add yourself (stored per campaign in screen/p_<id>) ----- */
const PANEL_TYPES = [
  { type: "encounter", title: "Encounter", blurb: "Run a Combats encounter here: initiative, turns, HP and conditions." },
  { type: "monster", title: "Monster", blurb: "A stat block with an HP box for each copy on the field." },
  { type: "days", title: "Day counter", blurb: "The in-game day, and potions or effects that expire." },
  { type: "dice", title: "Dice roller", blurb: "Quick rolls with modifier, advantage and disadvantage." },
  { type: "note", title: "Notes", blurb: "A free-text panel for anything else." },
];
const ABILS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
S.dice = {}; S.addingPanel = false;
function customPanels() { return [...S.mod.screen.values()].filter(d => d.id.startsWith("p_") && d.type); }
function allPanels() {
  const builtins = SCREEN_PANELS.filter(p => !p.gm || S.canGM).map(p => ({ id: p.id, title: p.title, custom: false }));
  const custom = S.canGM ? customPanels().map(d => ({ id: d.id, title: d.title || PANEL_TYPES.find(t => t.type === d.type)?.title || "Panel", custom: true, doc: d })) : [];
  const order = (S.mod.screen.get("layout")?.order || []);
  const all = [...custom, ...builtins];
  const pos = id => { const n = order.indexOf(id); return n < 0 ? 1000 + all.findIndex(p => p.id === id) : n; };
  return all.sort((a, b) => pos(a.id) - pos(b.id));
}
function saveOrder(ids) { commit("screen", "layout", "order", ids); render(); }
function panelControls(p, list) {
  const n = list.findIndex(x => x.id === p.id);
  if (!S.canWrite && p.custom) return "";
  return `<div class="pctl">
    ${S.canWrite ? `<button type="button" class="icon-btn grip-btn" data-grip-panel="${p.id}" aria-label="Move ${esc(p.title)}: drag it, or use the arrow keys" title="Drag to move (or focus and use arrow keys)">⠿</button>
    <button type="button" class="icon-btn swatch-btn" data-do="panel-style" data-id="${p.id}" aria-expanded="${S.stylePanel === p.id}" aria-label="Colour and text size for ${esc(p.title)}" title="Colour and text size"><span></span></button>` : ""}
    ${S.canWrite ? `<button type="button" class="icon-btn" data-do="panel-wide" data-id="${p.id}" aria-pressed="${panelSize(p).cols === "all"}" aria-label="${panelSize(p).cols === "all" ? "Make narrow" : "Make full width"}" title="${panelSize(p).cols === "all" ? "Make narrow" : "Make full width"}">⇔</button>` : ""}
    ${p.custom ? (S.confirm === "panel" + p.id
      ? `<span class="confirm">Remove? <button type="button" class="btn danger small" data-do="panel-del" data-id="${p.id}">Remove</button><button type="button" class="btn small" data-do="cancel">Keep</button></span>`
      : `<button type="button" class="icon-btn" data-do="ask" data-key="panel${p.id}" aria-label="Remove ${esc(p.title)}" title="Remove panel">×</button>`)
      : `<button type="button" class="icon-btn" data-do="screen-toggle" data-id="${p.id}" aria-label="Hide ${esc(p.title)}" title="Hide panel (turn it back on from the bar)">–</button>`}
  </div>${S.stylePanel === p.id ? styleMenu(p) : ""}`;
}
function panelTitle(i, ph) { return `<div class="ptitle">${fInput("screen", i, "title", null, { aria: "Panel title", ph })}</div>`; }
function notePanel(d) { return `${panelTitle(d.id, "Notes")}${fArea("screen", d.id, "text", null, { rows: 8, aria: "Notes", ph: "Anything you want to keep in view" })}`; }
function monsterPanel(d) {
  const m = "screen", i = d.id, max = int(d.hpMax), copies = clamp(int(d.copies) || 1, 1, 20);
  const mod = v => { const n = Math.floor((int(v || 10) - 10) / 2); return (n >= 0 ? "+" : "") + n; };
  return `${panelTitle(i, "Monster name")}
    <div class="mgrid">${fInput(m, i, "ac", "AC", { type: "number" })}${fInput(m, i, "hpMax", "HP", { type: "number" })}${fInput(m, i, "speed", "Speed", { ph: "30 ft" })}${fSelect(m, i, "cr", "CR", CRS.map(x => [x]), { dflt: "1" })}</div>
    <div class="abil">${ABILS.map(a => `<label>${a}${fInput(m, i, "ab." + a, null, { type: "number", aria: a, ph: "10" })}<span class="abmod">${mod(d.ab?.[a])}</span></label>`).join("")}</div>
    ${fArea(m, i, "actions", "Traits & actions", { rows: 5, ph: "Multiattack. Scimitar +4 to hit, 1d6+2 slashing…" })}
    <div class="msec"><div class="row-between"><h3>On the field</h3><span class="mgrid" style="flex:0 0 120px">${fInput(m, i, "copies", null, { type: "number", min: 1, max: 20, aria: "How many", ph: "1" })}</span></div>
      <div class="copies">${Array.from({ length: copies }, (_, k) => { const v = val(m, i, `hp.${k}`, ""); const down = v !== "" && Number(v) <= 0;
        return `<label class="copy ${down ? "down" : ""}">#${k + 1}${fInput(m, i, `hp.${k}`, null, { type: "number", aria: `HP of copy ${k + 1}`, ph: max ? String(max) : "HP" })}</label>`; }).join("")}</div>
      <p class="hint">Blank boxes are at full HP. 0 or less marks that one as down.</p></div>
    ${d.srd && MON.get(d.srd) ? `<details class="sb-fold"><summary>Full stat block</summary>${statBlock(MON.get(d.srd))}</details>`
      : d.npc && S.cards.get(d.npc)?.sb ? `<details class="sb-fold"><summary>Full stat block</summary>${statBlock(sbToMon(S.cards.get(d.npc)))}</details>` : ""}`;
}
function dicePanel(d) {
  const m = "screen", i = d.id, log = S.dice[i] || [];
  return `${panelTitle(i, "Dice")}
    <div class="mgrid">${fInput(m, i, "count", "Dice", { type: "number", min: 1, max: 20, ph: "1" })}${fInput(m, i, "mod", "Modifier", { type: "number", ph: "0" })}${fSelect(m, i, "mode", "d20 roll", [["normal", "Normal"], ["adv", "Advantage"], ["dis", "Disadvantage"]], { dflt: "normal" })}</div>
    <div class="dice-row">${[4, 6, 8, 10, 12, 20, 100].map(n => `<button type="button" class="btn" data-do="dice-roll" data-id="${i}" data-die="${n}">d${n}</button>`).join("")}</div>
    ${log.length ? `<div class="dice-result" aria-live="polite">${log[0].total}</div><ul class="dice-log">${log.map(r => `<li>${esc(r.text)}</li>`).join("")}</ul>` : `<p class="hint">Rolls show here. They aren't saved.</p>`}`;
}
function daysPanel() {
  const m = "screen", i = "calendar", cal = S.mod.screen.get("calendar") || {}, day = int(cal.day) || 1;
  const items = (cal.items || []).map((it, n) => ({ ...it, n, left: int(it.expires) - day })).sort((a, b) => a.left - b.left);
  return `<h2>Day ${day}</h2>
    ${S.canWrite ? `<div class="dice-row"><button type="button" class="btn" data-do="day-step" data-n="-1" aria-label="Back one day">− 1 day</button><button type="button" class="btn primary" data-do="day-step" data-n="1">+ 1 day</button><button type="button" class="btn" data-do="day-step" data-n="7">+ 1 week</button></div>` : ""}
    ${fInput(m, i, "label", null, { aria: "Calendar note", ph: "Date in your world, e.g. 3rd of Harvestmoon" })}
    <div class="msec"><h3>Expiring</h3>
      ${items.length ? `<div class="exp-list">${items.map(it => {
        const tone = it.left < 0 ? "bad" : it.left <= 2 ? "warn" : "good";
        const label = it.left < 0 ? `Expired day ${it.expires}` : it.left === 0 ? "Last day" : `${it.left} day${it.left === 1 ? "" : "s"} left`;
        return `<div class="exp ${it.left < 0 ? "gone" : ""}"><span class="en">${esc(it.name)}${it.who ? ` <em>· ${esc(it.who)}</em>` : ""}</span>${pill(label, tone)}${S.canWrite ? `<button type="button" class="icon-btn" data-do="exp-del" data-n="${it.n}" aria-label="Remove ${esc(it.name)}">×</button>` : ""}</div>`;
      }).join("")}</div>` : `<p class="hint">Nothing ticking down. Add potions, spells, rations or curses below.</p>`}
      ${S.canWrite ? `<div class="add-row"><input id="exp-name" placeholder="Potion of Healing" aria-label="What expires"><input id="exp-who" class="short" placeholder="Who" aria-label="Who has it"><input id="exp-days" class="short" type="number" min="0" placeholder="Days" aria-label="Lasts how many days"><button type="button" class="btn" data-do="exp-add">Add</button></div>` : ""}
    </div>`;
}
function encounterPanel(d) {
  const m = "screen", i = d.id, combats = sortedCombats(), c = S.mod.combats.get(d.combat);
  const pick = fSelect(m, i, "combat", null, [["", "Choose an encounter…"], ...combats.map(x => [x.id, x.title || "Untitled encounter"])], { aria: "Encounter" });
  if (!c) return `<h2>Encounter</h2>${combats.length ? pick : `<p class="hint">Build an encounter on the Combats tab first.</p><div><button type="button" class="btn" data-do="goto-tab" data-tab="combats">Open Combats</button></div>`}`;
  const st = encStats(c), cid = c.id;
  let body;
  if (!c.run) {
    body = `<ul class="tight">${(c.monsters || []).filter(mo => int(mo.count)).map(mo => `<li><b>${esc(mo.name || "Monster")}</b> ×${int(mo.count)} · CR ${esc(mo.cr)}${mo.ac ? ` · AC ${esc(mo.ac)}` : ""}${mo.hp ? ` · HP ${esc(mo.hp)}` : ""}</li>`).join("") || "<li>No monsters yet.</li>"}</ul>
      ${S.canWrite ? `<div><button type="button" class="btn primary" data-do="run-start" data-id="${esc(cid)}">Start combat</button></div>` : ""}`;
  } else {
    const order = sortedRun(c.run.list);
    body = `<div class="tracker-head"><span class="round">Round ${c.run.round || 1}</span>${S.canWrite ? `<button type="button" class="btn small" data-do="run-roll" data-id="${esc(cid)}">Roll init</button><button type="button" class="btn small" data-do="run-prev" data-id="${esc(cid)}">Previous</button><button type="button" class="btn primary small" data-do="run-next" data-id="${esc(cid)}">Next turn</button>` : ""}</div>
      <div class="ctrack">${order.map(x => { const active = x.id === c.run.active, down = x.hp !== "" && x.hp != null && Number(x.hp) <= 0;
        return `<div class="crow ${active ? "active" : ""} ${down ? "down" : ""}" id="crow-${esc(i)}-${esc(x.id)}">
          ${fInput("combats", cid, `run.list.${x.n}.init`, null, { type: "number", aria: `Initiative for ${x.name}`, ph: "Init" })}
          <div class="nm">${active ? `<span class="turn-tag">Turn</span>` : ""}<b>${esc(x.name)}</b><span class="hint">AC ${esc(x.ac || "—")}</span>
            ${(x.cond || []).map((cd, k) => `<span class="cchip">${esc(cd)}<button type="button" data-do="cond-del" data-id="${esc(cid)}" data-n="${x.n}" data-k="${k}" aria-label="Remove ${esc(cd)}">×</button></span>`).join("")}
            ${S.canWrite ? `<select class="csel" data-change="cond-add" data-id="${esc(cid)}" data-n="${x.n}" aria-label="Add a condition to ${esc(x.name)}"><option value="">+</option>${CONDITIONS.filter(cd => !(x.cond || []).includes(cd)).map(cd => `<option>${cd}</option>`).join("")}</select>` : ""}</div>
          <div class="hp">${fInput("combats", cid, `run.list.${x.n}.hp`, null, { type: "number", aria: `HP for ${x.name}`, ph: "HP" })}<span class="hint">/${esc(x.max || "—")}</span></div>
        </div>${active && typeof turnCard === "function" ? turnCard(c, x) : ""}`; }).join("")}</div>
      ${S.canWrite ? (S.confirm === "end" + cid ? `<span class="confirm">End this combat? <button type="button" class="btn danger small" data-do="run-end" data-id="${esc(cid)}">End combat</button><button type="button" class="btn small" data-do="cancel">Keep going</button></span>` : `<div><button type="button" class="btn small" data-do="ask" data-key="end${esc(cid)}">End combat</button></div>`) : ""}`;
  }
  return `<h2>${esc(c.title || "Encounter")}</h2>
    <div class="row-between">${pick}<span>${pill(st.label, st.tone)} <span class="mono hint">${fmtN(st.total)} XP</span></span></div>
    ${body}
    <div><button type="button" class="btn ghost small" data-do="goto" data-tab="combats" data-id="${esc(cid)}">Open in Combats</button></div>`;
}
const PANEL_RENDER = { note: notePanel, monster: monsterPanel, dice: dicePanel, days: daysPanel, encounter: encounterPanel };
function panelSize(p) {
  const sz = (S.mod.screen.get("layout")?.sizes || {})[p.id] || {};
  return { cols: sz.cols ?? (p.custom && p.doc.wide ? "all" : 1), h: int(sz.h) || 0 };
}
function panelHtml(p, list) {
  const sz = panelSize(p);
  const lk = panelLook(p.id);
  return `<section class="panel" id="panel-${p.id}" aria-label="${esc(p.title)}" data-cols="${sz.cols}" data-h="${sz.h}" data-color="${lk.c}" data-text="${lk.t}"${lk.c ? ` style="--pc:var(--c-${lk.c})"` : ""}>${panelControls(p, list)}<div class="pbody">${
    p.custom ? (PANEL_RENDER[p.doc.type] || notePanel)(p.doc) : p.id === "spells" ? spellPanel() : p.id === "guild" ? guildPanel() : SCREEN_STATIC[p.id]()}</div>${
    S.canWrite ? `<div class="presize" data-resize-panel="${p.id}" title="Drag to resize. Double-click to fit the content." aria-hidden="true"></div>` : ""}</section>`;
}
function renderScreen() {
  const list = allPanels();
  const on = list.filter(p => !S.screenOff.includes(p.id));
  return `<div class="screen-bar" role="group" aria-label="Panels"><span class="hint">Panels</span>${list.map(p => { const c = panelLook(p.id).c; return `<button type="button" class="chip${c ? " has-dot" : ""}" data-do="screen-toggle" data-id="${p.id}" aria-pressed="${!S.screenOff.includes(p.id)}"${c ? ` style="--pc:var(--c-${c})"` : ""}>${esc(p.title)}</button>`; }).join("")}
    ${S.canGM && S.canWrite ? `<button type="button" class="btn primary small" data-do="panel-add-open" aria-expanded="${S.addingPanel}">+ Add panel</button>` : ""}</div>
    ${S.addingPanel ? `<div class="panel-chooser">${PANEL_TYPES.map(t => `<button type="button" class="panel-choice" data-do="panel-add" data-type="${t.type}"><b>${t.title}</b><span>${t.blurb}</span></button>`).join("")}</div>` : ""}
    ${on.length ? `<div class="screen-grid">${on.map(p => panelHtml(p, list)).join("")}</div>`
      : `<div class="mempty-detail"><h2>All panels hidden</h2><p>Turn panels back on from the bar above, or add a new one.</p></div>`}`;
}
Object.assign(ACTIONS, {
  "panel-add-open": () => { S.addingPanel = !S.addingPanel; render(); },
  "panel-add": d => {
    const id = "p_" + uid(), t = PANEL_TYPES.find(x => x.type === d.type);
    const doc = { type: d.type, title: "", wide: d.type === "encounter" };
    if (d.type === "encounter") doc.combat = (sortedCombats().find(c => c.run) || sortedCombats().find(c => c.status !== "done") || {}).id || "";
    if (d.type === "monster") Object.assign(doc, { copies: 1, cr: "1" });
    S.addingPanel = false;
    S.screenOff = S.screenOff.filter(x => x !== id);
    putDoc("screen", id, doc, false);
    commit("screen", "layout", "pos." + id, { x: 0, y: -1 });
    const order = allPanels().map(p => p.id).filter(x => x !== id);
    saveOrder([id, ...order]);
    toast(`Added ${t.title} panel`);
    setTimeout(() => document.getElementById("panel-" + id)?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 60);
  },
  "panel-move": d => {
    const ids = allPanels().map(p => p.id), n = ids.indexOf(d.id), j = n + Number(d.dir);
    if (n < 0 || j < 0 || j >= ids.length) return;
    [ids[n], ids[j]] = [ids[j], ids[n]]; saveOrder(ids);
  },
  "panel-wide": d => {
    const p = allPanels().find(x => x.id === d.id); if (!p) return;
    const sz = panelSize(p);
    commit("screen", "layout", "sizes." + d.id, { cols: sz.cols === "all" ? 1 : "all", h: sz.h });
    render();
  },
  "panel-del": d => { S.confirm = null; delDoc("screen", d.id); saveOrder(allPanels().map(p => p.id).filter(x => x !== d.id)); toast("Panel removed"); },
  "dice-roll": d => {
    const p = S.mod.screen.get(d.id) || {}, die = Number(d.die), count = clamp(int(p.count) || 1, 1, 20), mod = int(p.mod);
    const r = () => 1 + Math.floor(Math.random() * die);
    let text, total;
    if (die === 20 && count === 1 && (p.mode === "adv" || p.mode === "dis")) {
      const a = r(), b = r(), keep = p.mode === "adv" ? Math.max(a, b) : Math.min(a, b);
      total = keep + mod; text = `d20 ${p.mode === "adv" ? "adv" : "dis"} (${a}, ${b}) → ${keep}${mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : ""} = ${total}`;
    } else {
      const rolls = Array.from({ length: count }, r); total = rolls.reduce((s, x) => s + x, 0) + mod;
      text = `${count}d${die} (${rolls.join(", ")})${mod ? (mod > 0 ? " + " : " − ") + Math.abs(mod) : ""} = ${total}`;
    }
    S.dice[d.id] = [{ text, total }, ...(S.dice[d.id] || [])].slice(0, 8);
    renderModule();
  },
  "day-step": d => {
    const cal = docCopy("screen", "calendar"), day = Math.max(1, (int(cal.day) || 1) + Number(d.n));
    const gone = (cal.items || []).filter(it => int(it.expires) < day && int(it.expires) >= (int(cal.day) || 1));
    cal.day = day; putDoc("screen", "calendar", cal);
    toast(gone.length ? `Day ${day}. Expired: ${gone.map(it => it.name).join(", ")}` : `Day ${day}`);
  },
  "exp-add": () => {
    const name = ($("#exp-name")?.value || "").trim(); if (!name) { $("#exp-name")?.focus(); return; }
    const days = Math.max(0, int($("#exp-days").value)), who = ($("#exp-who").value || "").trim();
    const cal = docCopy("screen", "calendar"), day = int(cal.day) || 1;
    cal.day = day; cal.items = [...(cal.items || []), { name, who, expires: day + days, added: day }];
    putDoc("screen", "calendar", cal);
    setTimeout(() => $("#exp-name")?.focus(), 30);
  },
  "exp-del": d => { const cal = docCopy("screen", "calendar"); cal.items.splice(Number(d.n), 1); putDoc("screen", "calendar", cal); },
});
ACTIONS["goto-tab"] = d => setTab(d.tab);

