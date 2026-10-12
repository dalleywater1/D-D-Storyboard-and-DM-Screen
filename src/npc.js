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
function sbToMon(c) {
  const sb = c.sb || {}, ab = ABILS.map((a, k) => int(sb.ab?.[k] ?? 10) || 10);
  return { n: c.title || "NPC", sz: sb.size || "Medium", t: sb.type || "humanoid", al: sb.al || "", ac: sb.ac || "—", hp: sb.hp || "—", hd: sb.hd || "",
    sp: sb.sp || "30 ft.", ab, sv: sb.sv || "", sk: sb.sk || "", vu: sb.vu || "", re: sb.re || "", im: sb.im || "", ci: sb.ci || "", se: sb.se || "", la: sb.la || "", g: sb.g || "",
    cr: sb.cr || "0", xp: CR_XP[sb.cr || "0"] ?? 0, pb: pbFor(sb.cr || "0"),
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
    ${c.imageId && blobUrl(c.imageId) ? `<img class="md-img" src="${blobUrl(c.imageId)}" alt="Portrait of ${esc(c.title || "NPC")}">` : `<div class="md-img portrait-empty" aria-hidden="true">${esc((c.title || "?").trim().charAt(0).toUpperCase())}</div>`}
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
  if (!editing) return `<div class="msec">${head}${use}<div class="npc-sb">${statBlock(sbToMon(c))}</div></div>`;
  const f = (p, label, o) => fInput(m, i, "sb." + p, label, o || {});
  return `<div class="msec">${head}
    <div class="mgrid">${f("size", "Size", { ph: "Medium" })}${f("type", "Type", { ph: "humanoid (human)" })}${f("al", "Alignment", { ph: "neutral" })}${fSelect(m, i, "sb.cr", "CR", CRS.map(x => [x]), { dflt: "1/8" })}</div>
    <div class="mgrid">${f("ac", "AC", { type: "number" })}${f("hp", "HP", { type: "number" })}${f("hd", "Hit dice", { ph: "2d8 + 2" })}${f("sp", "Speed", { ph: "30 ft." })}</div>
    <div class="abil">${ABILS.map((a, k) => `<label>${a}${fInput(m, i, `sb.ab.${k}`, null, { type: "number", aria: a, ph: "10" })}<span class="abmod">${abMod(int(c.sb.ab?.[k] ?? 10) || 10)}</span></label>`).join("")}</div>
    <div class="mgrid">${f("sv", "Saving throws", { ph: "Dex +4, Wis +2" })}${f("sk", "Skills", { ph: "Deception +5, Insight +2" })}${f("se", "Senses", { ph: "Passive Perception 12" })}${f("la", "Languages", { ph: "Common, Elvish" })}</div>
    <div class="mgrid">${f("re", "Resistances")}${f("im", "Immunities")}${f("ci", "Condition immunities")}${f("g", "Gear")}</div>
    <p class="hint">One entry per line, written as <b>Name. What it does.</b> For example: <i>Shortsword. Melee Attack Roll: +4, reach 5 ft. Hit: 5 (1d6 + 2) Piercing damage.</i></p>
    ${SB_SECTIONS.map(([k, label]) => fArea(m, i, "sb." + k, label, { rows: k === "a" ? 4 : 2 })).join("")}
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
