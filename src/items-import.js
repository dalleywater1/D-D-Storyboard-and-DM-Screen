/* ===================== Import items =====================
   Backup → Import items reads a list of items (JSON or CSV) into the campaign
   that's open, as Item cards gathered in a "Magic items" group on the Table.
   They then show in Quick Lookup and the Reference tab. An item whose name is
   already on an Item card in this campaign is skipped, so importing the same
   file twice never makes duplicates.

   JSON: { "storyboardItems": 1, "items": [ { name, type, rarity, attunement,
   description, source } ] }  (a bare array of items works too)
   CSV:  header row name,type,rarity,attunement,description,source */
const ITEM_GROUP = "Magic items";
function parseCsv(text) {
  const rows = []; let row = [], f = "", q = false;
  for (let n = 0; n < text.length; n++) {
    const ch = text[n];
    if (q) { if (ch === '"') { if (text[n + 1] === '"') { f += '"'; n++; } else q = false; } else f += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[n + 1] === "\n") n++; row.push(f); rows.push(row); row = []; f = ""; }
    else f += ch;
  }
  if (f !== "" || row.length) { row.push(f); rows.push(row); }
  const clean = rows.filter(r => r.some(x => x.trim()));
  if (!clean.length) return [];
  const head = clean[0].map(h => h.trim().toLowerCase());
  return clean.slice(1).map(r => Object.fromEntries(head.map((h, k) => [h, r[k] ?? ""])));
}
function readItems(text, fileName) {
  const t = text.replace(/^﻿/, "").trim();
  let list;
  if (/\.csv$/i.test(fileName) || !/^[[{]/.test(t)) list = parseCsv(t);
  else { const d = JSON.parse(t); list = Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : null; }
  if (!list) throw new Error("no items");
  const pick = (o, ...ks) => { for (const k of ks) for (const key of Object.keys(o)) if (key.toLowerCase() === k && o[key] != null && String(o[key]).trim()) return String(o[key]).trim(); return ""; };
  return list.filter(o => o && typeof o === "object").map(o => ({
    name: pick(o, "name", "title"), type: pick(o, "type", "category"), rarity: pick(o, "rarity"),
    attunement: pick(o, "attunement"), description: pick(o, "description", "desc", "text", "body"), source: pick(o, "source", "page", "book"),
  })).filter(it => it.name);
}
function itemBody(it) {
  const att = /^(no|none|false|-)$/i.test(it.attunement) ? "" : /^(yes|true)$/i.test(it.attunement) ? "requires attunement" : it.attunement;
  const line = [it.type, it.rarity].filter(Boolean).join(", ") + (att ? ` (${att})` : "");
  return [line ? `*${line.charAt(0).toUpperCase() + line.slice(1)}*` : "", it.description.replace(/\r\n/g, "\n"), it.source ? `*Source: ${it.source}*` : ""].filter(Boolean).join("\n\n");
}
async function importItems(file, msg) {
  if (!S.canWrite || !S.db) { msg.innerHTML = `<span class="err">This copy can't save, so items can't be imported here.</span>`; return; }
  let items;
  try { items = readItems(await file.text(), file.name); }
  catch { msg.innerHTML = `<span class="err">That file isn't an item list. It should be JSON with an "items" list, or a CSV with a name column.</span>`; return; }
  if (!items.length) { msg.innerHTML = `<span class="err">No items with a name were found in that file.</span>`; return; }
  const have = new Set([...S.cards.values()].filter(c => c.kind === "item").map(c => String(c.title).trim().toLowerCase()));
  const seen = new Set(), fresh = [];
  for (const it of items) { const k = it.name.toLowerCase(); if (have.has(k) || seen.has(k)) continue; seen.add(k); fresh.push(it); }
  const skipped = items.length - fresh.length;
  if (!fresh.length) { msg.innerHTML = `<span class="ok">All ${items.length} item${items.length === 1 ? " is" : "s are"} already in “${esc(S.meta.name)}”. Nothing new to add.</span>`; return; }
  let gid = [...groupsMap().values()].find(g => String(g.title).trim().toLowerCase() === ITEM_GROUP.toLowerCase())?.id;
  if (!gid) {
    let spot = { x: 24, y: 24 }; try { spot = visibleSpot(G_CLOSED.w, G_CLOSED.h); } catch {}
    gid = "g_" + uid();
    putDoc("groups", gid, { title: ITEM_GROUP, color: "", x: spot.x, y: spot.y, open: false, z: topZAll(), created: new Date().toISOString() }, false);
  }
  const now = new Date().toISOString();
  let order = nextOrder(""), n = 0;
  try {
    for (const it of fresh) {
      const c = { id: uid(), kind: "item", title: it.name, body: itemBody(it), act: "", status: "planned",
        tags: [it.type, it.rarity, it.attunement && !/^(no|none|false|-)$/i.test(it.attunement) ? "attunement" : ""].filter(Boolean).map(t => t.toLowerCase()),
        order: order++, color: "", imageId: "", links: [], group: gid, imported: true, created: now, updated: now };
      S.cards.set(c.id, c);
      await R(P().cards + "/" + c.id).set(c);
      if (++n % 20 === 0) msg.textContent = `Importing… ${n} of ${fresh.length}`;
    }
  } catch (e) { handleWriteError(e); }
  render();
  msg.innerHTML = `<span class="ok">Added ${n} item${n === 1 ? "" : "s"} to “${esc(S.meta.name)}”, in the “${ITEM_GROUP}” group on the Table.${skipped ? ` ${skipped} already here (same name), skipped.` : ""} Find them in Quick Lookup and Reference.</span>`;
  toast(`Imported ${n} item${n === 1 ? "" : "s"}`);
}
(() => {
  const at = [...document.querySelectorAll("#backup .section-title")].find(h => h.textContent.trim() === "Load a file");
  if (!at) return;
  at.insertAdjacentHTML("beforebegin", `<h3 class="section-title">Import items</h3>
    <p class="hint" style="margin:0">A list of items as JSON or CSV (name, type, rarity, attunement, description, source). Each becomes an Item card in this campaign, in a “${ITEM_GROUP}” group on the Table. Items already here with the same name are skipped.</p>
    <input type="file" id="items-in" accept=".json,.csv,application/json,text/csv">
    <span id="items-msg"></span>`);
  $("#items-in").onchange = async e => { const f = e.target.files[0]; if (f) { $("#items-msg").textContent = "Reading…"; await importItems(f, $("#items-msg")); } e.target.value = ""; };
})();
