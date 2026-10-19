/* ===================== Import homebrew =====================
   One JSON file can carry a book's (or your own) magic items, creatures and
   storyboard cards together:
   { "storyboardHomebrew": 1, "book": "My Homebrew",
     "items":     [ { name, type, rarity, attunement, description, page, notes } ],
     "creatures": [ { name, family, role, lore, notes, page, size, type, alignment, ac, hp, hitDice, speed,
                      abilities: [STR, DEX, CON, INT, WIS, CHA], saves, skills, vulnerabilities, resistances,
                      immunities, conditionImmunities, senses, languages, cr,
                      traits / actions / bonusActions / reactions / legendaryActions: [ { name, text } ] } ],
     "cards":     [ { kind: npc|location|town|item|lore|scene, title, body, tags: [], gm } ] }
   Items go to the Magic Items tab, creatures to the Bestiary (homebrew), cards to
   the Table in a group named after the book. Importing the same file again
   updates what it added before (matched by name), so nothing doubles. */
const HB_SECT = [["traits", "tr"], ["actions", "a"], ["bonusActions", "b"], ["reactions", "r"], ["legendaryActions", "l"]];
function hbPick(o, ...ks) { for (const k of ks) for (const key of Object.keys(o)) if (key.toLowerCase() === k.toLowerCase() && o[key] != null && String(o[key]).trim() !== "") return o[key]; return ""; }
function hbLines(v) {
  if (Array.isArray(v)) return v.map(e => typeof e === "string" ? e : e && (e.name || e.text) ? `${String(e.name || "").replace(/[.:]\s*$/, "")}${e.name ? ". " : ""}${String(e.text || e.desc || e.description || "").replace(/\s*\n+\s*/g, " ")}` : "").filter(Boolean).join("\n");
  return String(v || "");
}
function creatureDoc(o, book) {
  const abil = hbPick(o, "abilities", "ab");
  const ab = Array.isArray(abil) && abil.length === 6 ? abil.map(n => int(n) || 10) : ["str", "dex", "con", "int", "wis", "cha"].map(k => int(hbPick(o, k, k === "str" ? "strength" : k === "dex" ? "dexterity" : k === "con" ? "constitution" : k === "int" ? "intelligence" : k === "wis" ? "wisdom" : "charisma")) || 10);
  const sb = { size: String(hbPick(o, "size") || "Medium"), type: String(hbPick(o, "type") || "monstrosity"), al: String(hbPick(o, "alignment", "al")),
    ac: String(hbPick(o, "ac", "armorClass")), hp: String(hbPick(o, "hp", "hitPoints")), hd: String(hbPick(o, "hitDice", "hd")), sp: String(hbPick(o, "speed", "sp") || "30 ft."), ab,
    sv: String(hbPick(o, "saves", "savingThrows", "sv")), sk: String(hbPick(o, "skills", "sk")), vu: String(hbPick(o, "vulnerabilities", "vu")), re: String(hbPick(o, "resistances", "re")),
    im: String(hbPick(o, "immunities", "damageImmunities", "im")), ci: String(hbPick(o, "conditionImmunities", "ci")), se: String(hbPick(o, "senses", "se")), la: String(hbPick(o, "languages", "la")),
    cr: String(hbPick(o, "cr", "challenge") || "1"), g: String(hbPick(o, "gear", "g")) };
  for (const [k, s] of HB_SECT) sb[s] = hbLines(hbPick(o, k, s));
  const notes = String(hbPick(o, "notes", "gm") || ""), page = String(hbPick(o, "page") || "");
  const lore = [String(hbPick(o, "lore", "description") || ""), notes ? `**GM notes:** ${notes}` : "", book ? `*${book}${page ? ` · p. ${page}` : ""}*` : ""].filter(Boolean).join("\n\n");
  return { title: String(hbPick(o, "name", "title")).trim(), family: String(hbPick(o, "family") || ""), role: String(hbPick(o, "role") || ""), lore, book: book || "", sb };
}
async function importHomebrew(data, show) {
  const book = String((!Array.isArray(data) && (data.book || data.source)) || "").trim();
  let made = { creatures: 0, creaturesUp: 0, cards: 0, cardsUp: 0 };
  const now = new Date().toISOString();
  // creatures
  const cr = Array.isArray(data.creatures) ? data.creatures.filter(o => o && typeof o === "object" && hbPick(o, "name", "title")) : [];
  if (cr.length) {
    const have = new Map(hbDocs().map(d => [String(d.title).toLowerCase(), d]));
    for (const o of cr) {
      const doc = creatureDoc(o, book), old = have.get(doc.title.toLowerCase());
      const id = old ? old.id : uid(), full = { ...(old || { created: now }), ...doc, updated: now, id };
      S.mod.creatures.set(id, full); have.set(doc.title.toLowerCase(), full);
      await R(MP("creatures") + "/" + id).set(full);
      old ? made.creaturesUp++ : made.creatures++;
    }
  }
  // storyboard cards
  const cards = Array.isArray(data.cards) ? data.cards.filter(o => o && typeof o === "object" && hbPick(o, "title", "name")) : [];
  if (cards.length) {
    const kinds = new Set(KINDS.map(k => k.id));
    const gname = book || "Imported";
    let gid = [...groupsMap().values()].find(g => String(g.title).trim().toLowerCase() === gname.toLowerCase())?.id;
    if (!gid) { let spot = { x: 24, y: 24 }; try { spot = visibleSpot(G_CLOSED.w, G_CLOSED.h); } catch {} gid = "g_" + uid(); putDoc("groups", gid, { title: gname, color: "", x: spot.x, y: spot.y, open: false, z: topZAll(), created: now }, false); }
    let order = nextOrder("");
    for (const o of cards) {
      let kind = String(hbPick(o, "kind") || "lore").toLowerCase(); if (kind === "place") kind = "location"; if (!kinds.has(kind)) kind = "lore";
      const title = String(hbPick(o, "title", "name")).trim();
      const old = [...S.cards.values()].find(c => c.kind === kind && String(c.title).toLowerCase() === title.toLowerCase());
      if (old && !old.imported) continue; // never overwrite a card you made yourself
      const tags = hbPick(o, "tags"), c = { ...(old || { id: uid(), act: "", status: "planned", order: order++, color: "", imageId: "", links: [], group: gid, created: now }),
        kind, title, body: String(hbPick(o, "body", "text", "description") || ""), tags: (Array.isArray(tags) ? tags : String(tags || "").split(",")).map(t => String(t).trim()).filter(Boolean), imported: true, updated: now };
      S.cards.set(c.id, c); await R(P().cards + "/" + c.id).set(c);
      const gm = String(hbPick(o, "gm", "gmNotes", "notes") || "");
      if (gm && S.canGM) { S.gm.set(c.id, gm); await R(P().gm + "/" + c.id).set({ text: gm }); }
      old ? made.cardsUp++ : made.cards++;
    }
  }
  return made;
}
/* hook into the item importer: a JSON file with creatures or cards gets those too */
const _importItemFileHb = importItemFile;
importItemFile = async function (file, show) {
  const text = await file.text();
  let data = null; try { if (!/\.csv$/i.test(file.name)) data = parseBackupText(text); } catch {}
  const hasMore = data && !Array.isArray(data) && ((data.creatures || []).length || (data.cards || []).length);
  if (!hasMore) return _importItemFileHb({ name: file.name, text: async () => text }, show);
  if (!S.canWrite || !S.canGM || !S.db) { show(`<span class="err">This copy can't save, so nothing can be imported here.</span>`); return; }
  let itemMsg = "";
  if ((data.items || []).length) await _importItemFileHb({ name: file.name, text: async () => text }, h => { itemMsg = h; });
  show("Importing…");
  try {
    const m = await importHomebrew(data, show);
    const parts = [m.creatures && `${m.creatures} new creature${m.creatures === 1 ? "" : "s"}`, m.creaturesUp && `${m.creaturesUp} creature${m.creaturesUp === 1 ? "" : "s"} updated`,
      m.cards && `${m.cards} new card${m.cards === 1 ? "" : "s"}`, m.cardsUp && `${m.cardsUp} card${m.cardsUp === 1 ? "" : "s"} updated`].filter(Boolean);
    show(`${itemMsg ? itemMsg + "<br>" : ""}<span class="ok">${parts.join(", ") || "Nothing new"}${(m.creatures + m.creaturesUp) ? ". Creatures are in the Bestiary under Homebrew" : ""}${(m.cards + m.cardsUp) ? `. Cards are in the “${esc(data.book || "Imported")}” group on the Table` : ""}.</span>`);
    toast("Homebrew imported");
  } catch (e) { handleWriteError(e); }
  render();
};
/* name the Backup section for what it now takes */
(() => {
  const h = [...document.querySelectorAll("#backup .section-title")].find(x => x.textContent.trim() === "Import items"); if (!h) return;
  h.textContent = "Import homebrew";
  const p = h.nextElementSibling; if (p && p.classList.contains("hint")) p.textContent = "A homebrew file (JSON) with magic items, creatures and storyboard cards, or a CSV of items. Items go to the Magic Items tab, creatures to the Bestiary, cards to the Table in a group named after the book. Importing the same file again updates what it added.";
})();
