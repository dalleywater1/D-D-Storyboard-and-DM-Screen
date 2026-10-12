/* ===================== NPC portraits & stat blocks =====================
   The portrait is the NPC card's picture. The stat block lives on the card as
   `sb`; traits and actions are text, one per line as "Name. What it does." */
const SB_SECTIONS = [["tr", "Traits"], ["a", "Actions"], ["b", "Bonus Actions"], ["r", "Reactions"], ["l", "Legendary Actions"]];
S.sbEdit = {};
const pbFor = cr => { const n = crNum(cr); return n >= 29 ? 9 : n >= 25 ? 8 : n >= 21 ? 7 : n >= 17 ? 6 : n >= 13 ? 5 : n >= 9 ? 4 : n >= 5 ? 3 : 2; };
function linesToEntries(t) {
  return String(t || "").split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => {
    const m = l.match(/^([^.:]{1,60})[.:]\s+(.*)$/);
    return m ? [m[1].replace(/^\*+|\*+$/g, ""), m[2]] : ["", l];
  });
}
function entriesToLines(list) { return (list || []).map(([n, d]) => `${n}. ${plain(d).replace(/\n+/g, " ")}`).join("\n"); }
var sbToMon = function (c) {
  const sb = c.sb || {}, ab = ABILS.map((a, k) => int(sb.ab?.[k] ?? 10) || 10);
  return { n: c.title || "NPC", sz: sb.size || "Medium", t: sb.type || "humanoid", al: sb.al || "", ac: sb.ac || "—", hp: sb.hp || "—", hd: sb.hd || "",
    sp: sb.sp || "30 ft.", ab, sv: sb.sv || "", sk: sb.sk || "", vu: sb.vu || "", re: sb.re || "", im: sb.im || "", ci: sb.ci || "", se: sb.se || "", la: sb.la || "", g: sb.g || "",
    cr: sb.cr || "0", xp: CR_XP[sb.cr || "0"] ?? 0, pb: pbFor(sb.cr || "0"), init: sb.init,
    ...Object.fromEntries(SB_SECTIONS.map(([k]) => [k, linesToEntries(sb[k])])) };
}
function monToSb(m) {
  return { size: m.sz, type: m.t, al: m.al, ac: m.ac, hp: m.hp, hd: m.hd, sp: m.sp, ab: m.ab.slice(), sv: m.sv, sk: m.sk, vu: m.vu, re: m.re, im: m.im, ci: m.ci,
    se: m.se, la: m.la, g: m.g, cr: m.cr, from: m.n, ...Object.fromEntries(SB_SECTIONS.map(([k]) => [k, entriesToLines(m[k])])) };
}
function blankSb() { return { size: "Medium", type: "humanoid", al: "", ac: 12, hp: 11, hd: "2d8 + 2", sp: "30 ft.", ab: [10, 10, 10, 10, 10, 10], sv: "", sk: "", se: "Passive Perception 10", la: "Common", cr: "1/8", tr: "", a: "Club. Melee Attack Roll: +2, reach 5 ft. Hit: 2 (1d4) Bludgeoning damage.", b: "", r: "", l: "" }; }

/* ----- portrait ----- */
function portraitBlock(c) {
  const can = S.canWrite && S.assets;
  return `<div class="portrait">
    ${c.imageId && blobUrl(c.imageId) ? `<img class="md-img${S.canWrite ? " pos-drag" : ""}" src="${blobUrl(c.imageId)}" alt="Portrait of ${esc(c.title || "NPC")}" draggable="false" style="object-position:${imgPos(c)}"${S.canWrite ? ` data-pos-id="${esc(c.id)}" tabindex="0" title="Drag to move the picture in the frame (or use the arrow keys)"` : ""}>
      ${S.canWrite ? `<span class="hint portrait-hint">Drag the picture to move it</span>` : ""}` : `<div class="md-img portrait-empty" aria-hidden="true">${esc((c.title || "?").trim().charAt(0).toUpperCase())}</div>`}
    ${can ? `<label class="btn small">${c.imageId ? "Replace" : "Add portrait"}<input type="file" accept="image/*" data-portrait="${esc(c.id)}" hidden></label>` : ""}
    ${c.imageId ? `<button type="button" class="btn ghost small" data-do="portrait-dl" data-id="${esc(c.id)}">Download</button>` : ""}
    ${c.imageId && S.canWrite ? `<button type="button" class="btn ghost small" data-do="portrait-rm" data-id="${esc(c.id)}">Remove</button>` : ""}
  </div>`;
}
document.addEventListener("change", async e => {
  const inp = e.target.closest?.("[data-portrait]"); if (!inp) return;
  const f = inp.files[0], id = inp.dataset.portrait; inp.value = "";
  if (!f || !S.assets) return;
  toast("Uploading portrait…");
  try {
    const res = await S.assets.upload(await shrinkImage(f));
    commit("cards", id, "imageId", res.id); render(); toast("Portrait saved");
  } catch (err) { toast(err?.code === "quota_exceeded" ? "Picture storage is full. Remove some pictures first." : "That picture couldn't be used. Try a JPG or PNG."); }
});

/* ----- stat block section on the NPC page ----- */
function npcStatSection(c) {
  if (c.concealedStatBlock) {
    if (!S.canGM) return "";
    return `<details class="msec gm-box" ${S.sbEdit[c.id] ? "open" : ""}><summary>GM only — reveal hidden stat block</summary>${npcStatSectionContent(c)}</details>`;
  }
  return npcStatSectionContent(c);
}
function npcStatSectionContent(c) {
  const i = c.id, m = "cards";
  if (!c.sb) {
    return `<div class="msec"><h3>Stat block</h3>
      <p class="hint">Give this NPC stats so you can drop them into a fight. Start from any Bestiary creature, or from a blank commoner.</p>
      ${S.canWrite ? `<div class="add-row"><input id="sb-from-${esc(i)}" list="srd-monster-list" data-change="npc-sb-from" data-id="${esc(i)}" placeholder="Start from a Bestiary creature, e.g. Bandit Captain, Noble, Mage" aria-label="Start from a Bestiary creature">
        <button type="button" class="btn" data-do="npc-sb-blank" data-id="${esc(i)}">Blank stat block</button></div>` : ""}
    </div>`;
  }
  const editing = !!S.sbEdit[i];
  const combats = sortedCombats();
  const head = `<div class="row-between"><h3>Stat block${c.sb.from ? ` <span class="hint">based on ${esc(c.sb.from)}</span>` : ""}</h3>
    ${S.canWrite ? `<span class="actions"><button type="button" class="btn small" data-do="npc-sb-edit" data-id="${esc(i)}">${editing ? "Done editing" : "Edit"}</button>
      ${S.confirm === "sb" + i ? `<span class="confirm">Remove the stat block? <button type="button" class="btn danger small" data-do="npc-sb-rm" data-id="${esc(i)}">Remove</button><button type="button" class="btn small" data-do="cancel">Keep</button></span>`
        : `<button type="button" class="btn ghost small" data-do="ask" data-key="sb${esc(i)}">Remove</button>`}</span>` : ""}</div>`;
  const use = S.canGM && S.canWrite ? `<div class="best-actions">
      ${combats.length ? `<select id="npc-enc-${esc(i)}" aria-label="Encounter to add to">${combats.map(x => `<option value="${esc(x.id)}">${esc(x.title || "Untitled encounter")}</option>`).join("")}<option value="__new">New encounter</option></select>` : ""}
      <button type="button" class="btn primary small" data-do="npc-to-enc" data-id="${esc(i)}">${combats.length ? "Add to encounter" : "Start an encounter with them"}</button>
      <button type="button" class="btn small" data-do="npc-to-screen" data-id="${esc(i)}">Drop on DM Screen</button></div>` : "";
  if (!editing) return `<div class="msec">${head}${use}${typeof weaponsSection === "function" ? weaponsSection(c, false) : ""}<div class="npc-sb">${statBlock(sbToMon(c))}</div></div>`;
  const f = (p, label, o) => fInput(m, i, "sb." + p, label, o || {});
  return `<div class="msec">${head}
    <div class="mgrid">${f("size", "Size", { ph: "Medium" })}${f("type", "Type", { ph: "humanoid (human)" })}${f("al", "Alignment", { ph: "neutral" })}${fSelect(m, i, "sb.cr", "CR", CRS.map(x => [x]), { dflt: "1/8" })}</div>
    <div class="mgrid">${f("ac", "AC", { type: "number" })}${f("hp", "HP", { type: "number" })}${f("hd", "Hit dice", { ph: "2d8 + 2" })}${f("sp", "Speed", { ph: "30 ft." })}</div>
    <div class="abil">${ABILS.map((a, k) => `<label>${a}${fInput(m, i, `sb.ab.${k}`, null, { type: "number", aria: a, ph: "10" })}<span class="abmod">${abMod(int(c.sb.ab?.[k] ?? 10) || 10)}</span></label>`).join("")}</div>
    <div class="mgrid">${f("sv", "Saving throws", { ph: "Dex +4, Wis +2" })}${f("sk", "Skills", { ph: "Deception +5, Insight +2" })}${f("se", "Senses", { ph: "Passive Perception 12" })}${f("la", "Languages", { ph: "Common, Elvish" })}</div>
    <div class="mgrid">${f("re", "Resistances")}${f("im", "Immunities")}${f("ci", "Condition immunities")}${f("g", "Gear")}</div>
    <p class="hint">One entry per line, written as <b>Name. What it does.</b> For example: <i>Shortsword. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.</i></p>
    ${typeof weaponsSection === "function" ? weaponsSection(c, true) : ""}
    ${SB_SECTIONS.map(([k, label]) => fArea(m, i, "sb." + k, k === "a" ? "Other actions" : label, { rows: k === "a" ? 4 : 2, hint: k === "a" && c.sb.w?.length ? "Weapons above are added to the actions automatically." : "" })).join("")}
  </div>`;
}
Object.assign(ACTIONS, {
  "npc-sb-blank": d => { commit("cards", d.id, "sb", blankSb()); S.sbEdit[d.id] = true; render(); },
  "npc-sb-edit": d => { S.sbEdit[d.id] = !S.sbEdit[d.id]; render(); },
  "npc-sb-rm": d => { S.confirm = null; commit("cards", d.id, "sb", null); delete S.sbEdit[d.id]; render(); toast("Stat block removed"); },
  "portrait-rm": d => { commit("cards", d.id, "imageId", ""); render(); },
  "portrait-dl": async d => {
    const c = S.cards.get(d.id); if (!c?.imageId) return;
    const url = await imageToDataUrl(c.imageId);
    if (!url) { toast("The portrait couldn't be read."); return; }
    await download(`${(c.title || "portrait").replace(/[^\w-]+/g, "-").toLowerCase()}.jpg`, dataUrlToBlob(url));
  },
  "npc-to-enc": d => {
    const c = S.cards.get(d.id); if (!c?.sb) return;
    const row = { name: c.title || "NPC", cr: c.sb.cr || "0", count: 1, ac: c.sb.ac || "", hp: c.sb.hp || "", npc: c.id };
    let encId = document.getElementById("npc-enc-" + d.id)?.value;
    if (!encId || encId === "__new") {
      encId = uid();
      putDoc("combats", encId, { title: `${c.title || "NPC"} encounter`, where: "", status: "prep", ...partyDefaults(), monsters: [row], tactics: "", loot: "", run: null, created: new Date().toISOString() }, false);
    } else {
      const enc = docCopy("combats", encId);
      enc.monsters = [...(enc.monsters || []).filter(x => x.name || x.hp), row];
      putDoc("combats", encId, enc, false);
    }
    S.sel.combats = encId; render();
    toast(`Added ${c.title} to “${S.mod.combats.get(encId)?.title || "encounter"}”`);
  },
  "npc-to-screen": d => {
    const c = S.cards.get(d.id); if (!c?.sb) return;
    const mon = sbToMon(c), id = "p_" + uid();
    putDoc("screen", id, { type: "monster", title: c.title || "NPC", ac: c.sb.ac, hpMax: c.sb.hp, speed: c.sb.sp, cr: c.sb.cr, copies: 1, npc: c.id,
      ab: Object.fromEntries(ABILS.map((a, k) => [a, mon.ab[k]])), actions: monsterText(mon) }, false);
    commit("screen", "layout", "pos." + id, { x: 0, y: -1 });
    S.screenOff = S.screenOff.filter(x => x !== id);
    render(); toast(`${c.title} is on the DM Screen`);
  },
});
CHANGES["npc-sb-from"] = (d, el) => {
  const mon = MON_BY_NAME.get(el.value.trim().toLowerCase());
  if (!mon) { toast("Pick a creature from the list"); return; }
  commit("cards", d.id, "sb", monToSb(mon)); render();
  toast(`Stat block copied from ${mon.n}. Click Edit to change it.`);
};

/* ===================== NPC weapons =====================
   Stored on the stat block as sb.w: [{ n, d, t, k, rc, rg, ab, mb, p, x }]
   n name · d damage dice · t damage type · k melee|ranged|thrown · rc reach ·
   rg range · ab ability (auto picks STR, DEX or the better for Finesse) ·
   mb magic bonus · p properties · x extra on a hit. Attack and damage are
   worked out from the ability scores and the proficiency bonus for the CR. */
const W_RANGE = { Dagger: "20/60", Dart: "20/60", Handaxe: "20/60", Javelin: "30/120", "Light Hammer": "20/60", Spear: "20/60", Trident: "20/60",
  "Light Crossbow": "80/320", Shortbow: "80/320", Sling: "30/120", Blowgun: "25/100", "Hand Crossbow": "30/120", "Heavy Crossbow": "100/400",
  Longbow: "150/600", Musket: "40/120", Pistol: "30/90" };
const W_FIX = { Sling: { t: "Bludgeoning" }, Trident: { d: "1d8" } };
const WEAPONS = new Map((SRD.equipment || []).filter(e => /Weapon/.test(e.ca)).map(e => {
  const parts = e.s.split(" · "), dm = parts.find(x => /^\d+(d\d+)?\s+(Slashing|Piercing|Bludgeoning)$/.test(x)) || "1 Bludgeoning";
  const [d, t] = dm.split(/\s+/), props = parts.slice(parts.indexOf(dm) + 1).join(", ").split(/,\s*/).filter(Boolean);
  const thrown = props.includes("Thrown"), ranged = /Ranged/.test(e.ca) && !thrown;
  const w = { n: e.n, d, t, k: ranged ? "ranged" : thrown ? "thrown" : "melee", rc: props.includes("Reach") ? 10 : 5, rg: W_RANGE[e.n] || "", ab: "auto", mb: 0,
    p: props.join(", "), x: "" };
  return [e.n.toLowerCase(), { ...w, ...(W_FIX[e.n] || {}) }];
}));
const sgn = n => (n >= 0 ? "+" : "−") + Math.abs(n);
const diceExpr = (d, mod) => (mod ? `${d} ${mod > 0 ? "+" : "−"} ${Math.abs(mod)}` : d);
function diceAvg(d) { const m = String(d).match(/^(\d+)d(\d+)$/i); return m ? Math.floor(+m[1] * (+m[2] + 1) / 2) : int(d); }
function rollExpr(d) { const m = String(d).match(/^(\d+)d(\d+)$/i); if (!m) return { total: int(d), rolls: [] }; const rolls = Array.from({ length: +m[1] }, () => 1 + Math.floor(Math.random() * +m[2])); return { total: rolls.reduce((a, b) => a + b, 0), rolls }; }
const upDie = d => String(d).replace(/d(\d+)$/, (_, n) => "d" + ({ 4: 6, 6: 8, 8: 10, 10: 12 }[n] || n));
function weaponCalc(c, w) {
  const ab = (c.sb?.ab || []).map(v => int(v ?? 10) || 10), mod = k => Math.floor(((ab[k] ?? 10) - 10) / 2);
  const str = mod(0), dex = mod(1);
  let m;
  if (w.ab && w.ab !== "auto") m = mod(Math.max(0, ABILS.indexOf(w.ab)));
  else m = w.k === "ranged" ? dex : /Finesse/i.test(w.p || "") ? Math.max(str, dex) : str;
  const mb = int(w.mb), pb = pbFor(c.sb?.cr || "0");
  return { hit: m + pb + mb, dmg: m + mb };
}
function weaponLine(c, w) {
  const { hit, dmg } = weaponCalc(c, w), d = w.d || "1d4";
  const kind = w.k === "ranged" ? "Ranged Attack Roll" : w.k === "thrown" ? "Melee or Ranged Attack Roll" : "Melee Attack Roll";
  const where = w.k === "ranged" ? `range ${w.rg || "80/320"} ft.` : w.k === "thrown" ? `reach ${w.rc || 5} ft. or range ${w.rg || "20/60"} ft.` : `reach ${w.rc || 5} ft.`;
  const vers = w.k !== "ranged" && /Versatile/i.test(w.p || "") && /d\d+$/.test(d) ? `, or ${Math.max(1, diceAvg(upDie(d)) + dmg)} (${diceExpr(upDie(d), dmg)}) ${w.t} damage when used with both hands` : "";
  return `${w.n || "Weapon"}. ${kind}: ${sgn(hit)}, ${where} Hit: ${Math.max(1, diceAvg(d) + dmg)} (${/d/.test(d) ? diceExpr(d, dmg) : d}) ${w.t || ""} damage${vers}${w.x ? " " + w.x.trim().replace(/\.$/, "") : ""}.`.replace(/\s+/g, " ");
}
/* the stat block shows the weapons as actions, after Multiattack */
function actionsWithWeapons(c) {
  const ws = (c.sb?.w || []).filter(Boolean).map(w => weaponLine(c, w)), lines = String(c.sb?.a || "").split(/\n+/).filter(l => l.trim());
  if (!ws.length) return lines.join("\n");
  const k = lines.findIndex(l => /^multiattack[.:]/i.test(l.trim()));
  return [...lines.slice(0, k + 1), ...ws, ...lines.slice(k + 1)].join("\n");
}
const _sbToMon = sbToMon;
sbToMon = c => { const m = _sbToMon(c); if (c.sb?.w?.length) m.a = linesToEntries(actionsWithWeapons(c)); return m; };
/* Roll20 gets the weapons in the Actions text */
const _snapshotData = snapshotData;
snapshotData = source => {
  const d = _snapshotData(source);
  if (source === "storyboard") d.cards = d.cards.map(c => c.sb?.w?.length ? { ...c, sb: { ...c.sb, a: actionsWithWeapons(c) } } : c);
  return d;
};

S.wRoll = {};
function weaponsSection(c, editing) {
  const i = c.id, ws = c.sb.w || [], can = S.canWrite;
  const add = can ? `<div class="add-row"><input id="w-add-${esc(i)}" list="srd-weapon-list" data-change="npc-w-add" data-id="${esc(i)}" placeholder="Add a weapon, e.g. Longsword, Shortbow, Dagger" aria-label="Add a weapon">
      <button type="button" class="btn small" data-do="npc-w-custom" data-id="${esc(i)}">Custom weapon</button></div>` : "";
  if (!ws.length) return `<div class="wsec"><h4>Weapons</h4>${add}</div>`;
  const roll = S.wRoll[i];
  if (!editing) {
    return `<div class="wsec"><h4>Weapons</h4>
      <div class="wtable-wrap"><table class="mt wtable"><thead><tr><th>Weapon</th><th class="num">To hit</th><th>Damage</th><th>Reach / range</th><th>Properties</th><th></th></tr></thead><tbody>
      ${ws.map((w, n) => { const { hit, dmg } = weaponCalc(c, w); const where = w.k === "ranged" ? w.rg : w.k === "thrown" ? `${w.rc || 5} ft. · ${w.rg}` : `${w.rc || 5} ft.`;
        return `<tr><td><b>${esc(w.n || "Weapon")}</b></td><td class="num">${sgn(hit)}</td><td>${esc(/d/.test(w.d) ? diceExpr(w.d, dmg) : w.d)} ${esc(w.t || "")}${w.x ? ` <span class="hint">${esc(w.x)}</span>` : ""}</td><td>${esc(where || "")}</td><td class="hint">${esc(w.p || "")}</td>
          <td class="wbtns"><button type="button" class="btn small" data-do="npc-w-roll" data-id="${esc(i)}" data-n="${n}" data-r="hit">Attack</button><button type="button" class="btn small" data-do="npc-w-roll" data-id="${esc(i)}" data-n="${n}" data-r="dmg">Damage</button></td></tr>`; }).join("")}
      </tbody></table></div>
      ${roll ? `<p class="wroll" aria-live="polite">${roll}</p>` : ""}
      ${add}</div>`;
  }
  const m = "cards", f = (n, p, label, o) => fInput(m, i, `sb.w.${n}.${p}`, label, o || {});
  return `<div class="wsec"><h4>Weapons</h4>
    ${ws.map((w, n) => `<div class="wedit">
      <div class="mgrid">${f(n, "n", "Name")}${f(n, "d", "Damage dice", { ph: "1d8" })}${fSelect(m, i, `sb.w.${n}.t`, "Damage type", ["Slashing", "Piercing", "Bludgeoning", "Fire", "Cold", "Lightning", "Thunder", "Acid", "Poison", "Necrotic", "Radiant", "Force", "Psychic"].map(x => [x]))}
        ${fSelect(m, i, `sb.w.${n}.k`, "Kind", [["melee", "Melee"], ["ranged", "Ranged"], ["thrown", "Melee or thrown"]])}</div>
      <div class="mgrid">${fSelect(m, i, `sb.w.${n}.rc`, "Reach", [["5", "5 ft."], ["10", "10 ft."], ["15", "15 ft."]], { dflt: "5" })}${f(n, "rg", "Range", { ph: "80/320" })}
        ${fSelect(m, i, `sb.w.${n}.ab`, "Ability", [["auto", "Auto"], ...ABILS.map(a => [a])], { dflt: "auto" })}${f(n, "mb", "Magic bonus", { type: "number", ph: "0" })}</div>
      <div class="mgrid">${f(n, "p", "Properties", { ph: "Finesse, Light", wide: true })}${f(n, "x", "Extra on a hit", { ph: "plus 7 (2d6) Poison damage", wide: true })}</div>
      <div class="row-between"><span class="hint">${esc(weaponLine(c, w))}</span><button type="button" class="btn ghost small" data-do="npc-w-rm" data-id="${esc(i)}" data-n="${n}">Remove weapon</button></div>
    </div>`).join("")}
    ${add}</div>`;
}
Object.assign(ACTIONS, {
  "npc-w-custom": d => { const c = S.cards.get(d.id); if (!c?.sb) return; commit("cards", d.id, "sb.w", [...(c.sb.w || []), { n: "New weapon", d: "1d6", t: "Slashing", k: "melee", rc: 5, rg: "", ab: "auto", mb: 0, p: "", x: "" }]); S.sbEdit[d.id] = true; render(); },
  "npc-w-rm": d => { const c = S.cards.get(d.id); if (!c?.sb) return; commit("cards", d.id, "sb.w", (c.sb.w || []).filter((_, n) => n !== int(d.n))); render(); },
  "npc-w-roll": d => {
    const c = S.cards.get(d.id), w = c?.sb?.w?.[int(d.n)]; if (!w) return;
    const { hit, dmg } = weaponCalc(c, w);
    if (d.r === "hit") {
      const r = 1 + Math.floor(Math.random() * 20);
      S.wRoll[d.id] = `<b>${esc(w.n)}</b> attack: <b class="big">${r + hit}</b> <span class="hint">(d20 ${r} ${sgn(hit)})</span>${r === 20 ? " <b>Natural 20: critical hit!</b>" : r === 1 ? " Natural 1: miss." : ""}`;
    } else {
      const a = rollExpr(w.d), b = rollExpr(w.d), tot = Math.max(1, a.total + dmg), crit = Math.max(1, a.total + b.total + dmg);
      S.wRoll[d.id] = `<b>${esc(w.n)}</b> damage: <b class="big">${tot}</b> ${esc(w.t || "")} <span class="hint">(${a.rolls.join(" + ") || a.total} ${sgn(dmg)})</span> · on a crit <b>${crit}</b>${w.x ? ` <span class="hint">${esc(w.x)}</span>` : ""}`;
    }
    renderModule();
  },
});
CHANGES["npc-w-add"] = (d, el) => {
  const w = WEAPONS.get(el.value.trim().toLowerCase());
  if (!w) { toast("Pick a weapon from the list, or use Custom weapon"); return; }
  const c = S.cards.get(d.id); if (!c?.sb) return;
  if (!c.sb.w?.length && String(c.sb.a || "").trim() === blankSb().a) commit("cards", d.id, "sb.a", "");
  commit("cards", d.id, "sb.w", [...(c.sb.w || []), { ...w }]); el.value = ""; render();
  toast(`${w.n} added`);
};
document.body.insertAdjacentHTML("beforeend", `<datalist id="srd-weapon-list">${[...WEAPONS.values()].map(w => `<option value="${esc(w.n)}">`).join("")}</datalist>`);

/* ----- moving a picture inside its frame: drag it, or arrow keys when it has focus ----- */
let posDrag = null;
const curPos = c => imgPos(c).split(" ").map(v => parseFloat(v));
function savePos(id, x, y) { commit("cards", id, "imgPos", { x: Math.round(x), y: Math.round(y) }); }
document.addEventListener("pointerdown", e => {
  const img = e.target.closest?.("img[data-pos-id]"); if (!img || e.button !== 0) return;
  const c = S.cards.get(img.dataset.posId); if (!c) return;
  e.preventDefault();
  const [x, y] = curPos(c), r = img.getBoundingClientRect();
  // how far the picture overflows the frame, so dragging moves it 1:1 under the pointer
  const sc = Math.max(r.width / (img.naturalWidth || r.width), r.height / (img.naturalHeight || r.height));
  const ox = Math.max(1, (img.naturalWidth || r.width) * sc - r.width), oy = Math.max(1, (img.naturalHeight || r.height) * sc - r.height);
  posDrag = { img, id: c.id, sx: e.clientX, sy: e.clientY, x, y, nx: x, ny: y, ox, oy, pid: e.pointerId };
  S.holdRender = true; img.classList.add("dragging");
  try { img.setPointerCapture(e.pointerId); } catch {}
});
document.addEventListener("pointermove", e => {
  const d = posDrag; if (!d || e.pointerId !== d.pid) return;
  d.nx = Math.min(100, Math.max(0, d.x - (e.clientX - d.sx) / d.ox * 100));
  d.ny = Math.min(100, Math.max(0, d.y - (e.clientY - d.sy) / d.oy * 100));
  d.img.style.objectPosition = `${d.nx}% ${d.ny}%`;
});
function endPosDrag(e) {
  const d = posDrag; if (!d || (e && e.pointerId !== d.pid)) return;
  posDrag = null; S.holdRender = false; d.img.classList.remove("dragging");
  if (Math.abs(d.nx - d.x) + Math.abs(d.ny - d.y) > 0.5) { savePos(d.id, d.nx, d.ny); render(); }
}
document.addEventListener("pointerup", endPosDrag);
document.addEventListener("pointercancel", endPosDrag);
document.addEventListener("keydown", e => {
  const img = e.target.closest?.("img[data-pos-id]"); if (!img) return;
  const k = { ArrowLeft: [5, 0], ArrowRight: [-5, 0], ArrowUp: [0, 5], ArrowDown: [0, -5] }[e.key]; if (!k) return;
  e.preventDefault();
  const c = S.cards.get(img.dataset.posId); if (!c) return;
  const [x, y] = curPos(c); savePos(c.id, Math.min(100, Math.max(0, x + k[0])), Math.min(100, Math.max(0, y + k[1]))); render();
  setTimeout(() => document.querySelector(`img[data-pos-id="${img.dataset.posId}"]`)?.focus(), 30);
});
