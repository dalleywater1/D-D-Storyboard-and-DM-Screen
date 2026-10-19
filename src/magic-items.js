/* ===================== Magic Items tab =====================
   Every magic item in one searchable list: the 262 SRD 5.2 items (the free
   2024 rules) built in, items imported from other books (stored per campaign
   in gmx/<board>/magicitems, so they travel with backups and GitHub saves but
   never sit in the site's code), items you make yourself, and your Item cards.
   Each item shows its book as a tagline.

   Import (here or in Backup): JSON  { "book": "Book title", "items": [ { name,
   type, rarity, attunement, description, page, notes } ] }  or CSV with those
   columns. "source": "Book p. 12" works instead of book + page. notes are GM-only
   (e.g. what changed for 5.5e). Re-importing a book updates its items by name. */
MOD_COLLS.push("magicitems");
const SRD_BOOK = "SRD 5.2 (2024 rules)";
const MI_RAR = ["common", "uncommon", "rare", "very rare", "legendary", "artifact", "varies"];
const MI_TYPES = ["Armor", "Weapon", "Wondrous item", "Potion", "Ring", "Rod", "Scroll", "Staff", "Wand"];
S.mi = { q: "", book: "", rar: "", type: "", att: "" }; S.miEdit = null;
const miRarity = r => {
  const s = String(r || "").toLowerCase(); if (!s) return "";
  const t = s.replace(/very rare/g, "§"), f = new Set();
  if (/\bcommon\b/.test(t.replace(/uncommon/g, ""))) f.add("common");
  if (/uncommon/.test(t)) f.add("uncommon");
  if (/\brare\b/.test(t)) f.add("rare");
  if (/§/.test(t)) f.add("very rare");
  if (/legendary/.test(t)) f.add("legendary");
  if (/artifact/.test(t)) f.add("artifact");
  return f.size === 1 ? [...f][0] : f.size ? "varies" : /varies/.test(s) ? "varies" : s;
};
const miType = t => { const s = String(t || "").toLowerCase(); return MI_TYPES.find(x => s.startsWith(x.toLowerCase().replace(/ item$/, ""))) || (s ? "Wondrous item" : ""); };
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
/* the SRD items, once */
const MI_SRD = SRD.items.map((x, n) => {
  const lines = String(x.d || "").split("\n"), first = lines[0].trim();
  const typeLine = /^(Armor|Weapon|Wondrous|Potion|Ring|Rod|Scroll|Staff|Wand)/i.test(first) ? first.replace(/\s+$/, "") : (x.ca || "").replace(/s$/, "");
  return { id: "srd:" + n, name: x.n, type: typeLine, rarity: x.ra || "", attunement: x.at ? "requires attunement" : "", description: (typeLine === first ? lines.slice(1).join("\n") : x.d || "").trim(), book: SRD_BOOK, page: "", srd: true };
});
function miAll() {
  const mine = S.mod && S.mod.magicitems ? [...S.mod.magicitems.values()].filter(d => d.name).map(d => ({ ...d, id: "mi:" + d.id, doc: d })) : [];
  const cards = [...S.cards.values()].filter(c => c.kind === "item" && c.title && !c.archived && !c.miRef).map(c => ({ id: "card:" + c.id, name: c.title, type: "", rarity: "", attunement: "", description: c.body || "", book: "Your Item cards", page: "", card: c }));
  return [...mine, ...MI_SRD, ...cards];
}
const miBooks = all => [...new Set(all.map(x => x.book || "Homebrew"))].sort((a, b) => (a === SRD_BOOK ? -1 : b === SRD_BOOK ? 1 : a === "Your Item cards" ? 1 : b === "Your Item cards" ? -1 : a.localeCompare(b)));
const miLine = x => { const t = [x.type, x.rarity].filter(Boolean).join(", "); return t ? cap(t) + (x.attunement ? ` (${x.attunement})` : "") : ""; };
const miTag = x => `${x.book || "Homebrew"}${x.page ? ` · p. ${x.page}` : ""}`;
function miFilter(all) {
  const q = S.mi.q.trim().toLowerCase();
  let list = all.filter(x => (!S.mi.book || (x.book || "Homebrew") === S.mi.book) && (!S.mi.rar || miRarity(x.rarity) === S.mi.rar)
    && (!S.mi.type || miType(x.type) === S.mi.type) && (!S.mi.att || (S.mi.att === "yes") === !!x.attunement));
  if (q) {
    const sc = [];
    for (const x of list) { const n = x.name.toLowerCase(); let s = n === q ? 0 : n.startsWith(q) ? 1 : n.includes(q) ? 2 : -1;
      if (s < 0 && q.length >= 3 && (x.type + " " + x.description).toLowerCase().includes(q)) s = 3; if (s >= 0) sc.push([s, x]); }
    list = sc.sort((a, b) => a[0] - b[0] || a[1].name.localeCompare(b[1].name)).map(v => v[1]);
  } else list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
  return list;
}
const bookAbbr = b => b === SRD_BOOK ? "SRD" : b === "Your Item cards" ? "Card" : (String(b).replace(/^the\s+/i, "").match(/\b[\w']/g) || []).join("").replace(/'/g, "").toUpperCase().slice(0, 4) || "HB";
function miBody(x, opts = {}) {
  const gm = S.canGM && x.notes;
  return `<div class="statblock mi-block"><div class="sb-head"><h2>${esc(x.name)}</h2>${miLine(x) ? `<div class="sb-type">${esc(miLine(x))}</div>` : ""}<div class="mi-book">${esc(miTag(x))}</div></div>
    <div class="ref-body">${md(x.description) || `<p class="hint">No description yet.</p>`}</div>
    ${gm ? `<div class="mi-notes"><b>GM notes</b>${md(x.notes)}</div>` : ""}
    ${x.card && S.canGM && S.gm.get(x.card.id) ? `<div class="mi-notes"><b>GM notes</b>${md(S.gm.get(x.card.id))}</div>` : ""}
    ${x.srd && !opts.noCredit ? `<p class="credit">${SRD_CREDIT}</p>` : ""}</div>`;
}
function miEditor(d) {
  const m = "magicitems", i = d.id;
  return `<div class="mi-edit"><div class="mgrid">${fInput(m, i, "name", "Name", { wide: true })}${fInput(m, i, "type", "Type", { ph: "Wondrous item / Weapon (longsword)" })}
      ${fSelect(m, i, "rarity", "Rarity", MI_RAR.map(r => [r, cap(r)]), { dflt: "uncommon" })}${fInput(m, i, "attunement", "Attunement", { ph: "requires attunement by a wizard (blank if none)" })}
      ${fInput(m, i, "book", "Book", { ph: "Homebrew" })}${fInput(m, i, "page", "Page", { ph: "27" })}</div>
    ${fArea(m, i, "description", "Description", { rows: 8, ph: "What it does. **bold** and *italic* work." })}
    ${fArea(m, i, "notes", "GM notes", { rows: 3, hint: "only you see these", ph: "5.5e changes, where the party found it, who wants it back…" })}</div>`;
}
/* Bestiary-style buttons: put the item into an encounter's loot, onto the DM
   Screen, or onto the storyboard as an Item card you can link to NPCs and scenes. */
function miActions(x) {
  if (!S.canGM || !S.canWrite || x.card) return "";
  const combats = sortedCombats();
  return `<div class="best-actions">
    ${combats.length ? `<select id="mi-enc" aria-label="Encounter to add the item to">${combats.map(c => `<option value="${esc(c.id)}" ${c.id === S.sel.combats ? "selected" : ""}>${esc(c.title || "Untitled encounter")}</option>`).join("")}</select>
    <button type="button" class="btn primary" data-do="mi-to-enc" data-id="${esc(x.id)}">Add to encounter loot</button>` : ""}
    <button type="button" class="btn" data-do="mi-to-screen" data-id="${esc(x.id)}">Drop on DM Screen</button>
    <button type="button" class="btn" data-do="mi-card" data-id="${esc(x.id)}">Make a storyboard card</button>
  </div>`;
}
const miFind = id => miAll().find(v => v.id === id);
const miSnap = x => ({ name: x.name, type: x.type || "", rarity: x.rarity || "", attunement: x.attunement || "", description: x.description || "", book: x.book || "", page: x.page || "", notes: x.notes || "", srd: !!x.srd });
function miCardText(x) { return [miLine(x) ? `*${miLine(x)}*` : "", x.description || "", `*${miTag(x)}*`].filter(Boolean).join("\n\n"); }
/* the DM Screen panel for an item */
function itemPanel(d) {
  const live = d.ref && miFind(d.ref), x = live || { ...(d.snap || {}), name: (d.snap && d.snap.name) || d.title || "Item" };
  return `<h2>${esc(x.name)}</h2>${miBody({ ...x, name: "" }, { noCredit: false }).replace('<div class="sb-head"><h2></h2>', '<div class="sb-head">')}
    ${fArea("screen", d.id, "who", null, { rows: 2, aria: "Who has it", ph: "Who has it, charges left, where it was found…" })}
    ${live ? `<div><button type="button" class="btn ghost small" data-do="mi-open" data-id="${esc(d.ref)}">Open in Magic Items</button></div>` : ""}`;
}
PANEL_RENDER.item = itemPanel;
function renderMagicItems() {
  const all = miAll(), list = miFilter(all);
  const id = pickSel("magicitems", list);
  const x = id && list.find(v => v.id === id);
  const books = miBooks(all), cnt = b => all.filter(v => (v.book || "Homebrew") === b).length;
  const filters = `<input id="mi-q" type="search" data-q="mi" placeholder="Search items, effects…" aria-label="Search magic items" value="${esc(S.mi.q)}">
    <select data-change="mi-f" data-k="book" aria-label="Book"><option value="">All books (${all.length})</option>${books.map(b => `<option value="${esc(b)}" ${b === S.mi.book ? "selected" : ""}>${esc(b)} (${cnt(b)})</option>`).join("")}</select>
    <div class="mi-frow"><select data-change="mi-f" data-k="rar" aria-label="Rarity"><option value="">Any rarity</option>${MI_RAR.map(r => `<option value="${r}" ${r === S.mi.rar ? "selected" : ""}>${cap(r)}</option>`).join("")}</select>
    <select data-change="mi-f" data-k="type" aria-label="Type"><option value="">Any type</option>${MI_TYPES.map(t => `<option ${t === S.mi.type ? "selected" : ""}>${t}</option>`).join("")}</select>
    <select data-change="mi-f" data-k="att" aria-label="Attunement"><option value="">Attunement: any</option><option value="yes" ${S.mi.att === "yes" ? "selected" : ""}>Needs attunement</option><option value="no" ${S.mi.att === "no" ? "selected" : ""}>No attunement</option></select></div>
    <div class="mi-frow"><span class="hint">${list.length} item${list.length === 1 ? "" : "s"}</span>${S.canWrite && S.canGM ? `<label class="btn small ghost mi-imp">Import a book…<input type="file" id="mi-file" accept=".json,.csv,application/json,text/csv" hidden></label>` : ""}</div>
    <div id="mi-imp-msg" class="mi-imp-msg" aria-live="polite">${S.miImpMsg || ""}</div>`;
  const items = list.map(v => ({ id: v.id, title: v.name, sub: [cap(miRarity(v.rarity)), miType(v.type)].filter(Boolean).join(" · ") || (v.card ? "Item card" : ""), badge: `<span class="mi-abbr" title="${esc(v.book || "Homebrew")}">${esc(bookAbbr(v.book || "Homebrew"))}</span>` }));
  let detail;
  if (!x) detail = emptyDetail(all.length ? "Nothing matches" : "No items", "Try a shorter word, or clear the filters.");
  else {
    const editing = x.doc && S.miEdit === x.doc.id && S.canWrite;
    const acts = x.doc && S.canWrite ? `<div class="row-between"><span class="hb-tag">${esc(x.book || "Homebrew")}</span><span class="actions"><button type="button" class="btn small" data-do="mi-edit" data-id="${esc(x.doc.id)}">${editing ? "Done editing" : "Edit"}</button></span></div>`
      : x.card ? `<div class="actions"><button type="button" class="btn small" data-do="open-card" data-id="${esc(x.card.id)}">Open the card</button></div>`
      : x.srd && S.canWrite && S.canGM ? `<div class="actions"><button type="button" class="btn small ghost" data-do="mi-copy" data-id="${esc(x.id)}">Make a homebrew copy to change</button></div>` : "";
    detail = `<section class="mdetail" aria-label="${esc(x.name)}">${acts}${editing ? "" : miActions(x)}${editing ? miEditor(x.doc) : miBody(x)}
      ${x.doc && S.canWrite ? `<div class="md-foot"><span class="spacer"></span>${delBtn("mi", x.doc.id, "Delete item", "mi-del")}</div>` : ""}</section>`;
  }
  return `<div class="mod">${listPane({ mod: "magicitems", title: "Magic Items", items, sel: id, empty: "No item matches.", filters, newDo: S.canGM ? "mi-new" : "", newLabel: "+ Item" })}${detail}</div>`;
}
MODULES.splice(MODULES.findIndex(m => m.id === "bestiary") + 1, 0, { id: "magicitems", label: "Magic Items", render: () => renderMagicItems() });

/* ----- search box and filters ----- */
document.addEventListener("input", e => { const q = e.target.closest?.('[data-q="mi"]'); if (!q) return; S.mi.q = q.value; e.stopImmediatePropagation(); renderModule(); }, true);
CHANGES["mi-f"] = (d, el) => { S.mi[d.k] = el.value; renderModule(); };

/* ----- importing a book ----- */
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
function readItemFile(text, fileName) {
  const t = text.replace(/^﻿/, "").trim();
  let list, fileBook = "";
  if (/\.csv$/i.test(fileName) || !/^[[{]/.test(t)) list = parseCsv(t);
  else { const d = JSON.parse(t); list = Array.isArray(d) ? d : Array.isArray(d.items) ? d.items : null; fileBook = (!Array.isArray(d) && (d.book || d.source)) || ""; }
  if (!list) throw new Error("no items");
  const pick = (o, ...ks) => { for (const k of ks) for (const key of Object.keys(o)) if (key.toLowerCase() === k && o[key] != null && String(o[key]).trim()) return String(o[key]).trim(); return ""; };
  return list.filter(o => o && typeof o === "object").map(o => {
    let book = pick(o, "book") || "", page = pick(o, "page"), src = pick(o, "source");
    if (src && !book) { const m = src.match(/^(.*?)[,\s]*(?:p\.|page)\s*(\d+)\s*$/i); if (m) { book = m[1].trim(); page = page || m[2]; } else book = src; }
    const att = pick(o, "attunement");
    return { name: pick(o, "name", "title"), type: pick(o, "type", "category"), rarity: pick(o, "rarity").toLowerCase(),
      attunement: /^(no|none|false|-)$/i.test(att) ? "" : /^(yes|true)$/i.test(att) ? "requires attunement" : att,
      description: pick(o, "description", "summary", "desc", "text", "body").replace(/\r\n/g, "\n"), book: book || fileBook || "Imported", page: page.replace(/^p\.\s*/i, ""),
      notes: pick(o, "notes", "conversion", "changes", "gm"), sub: pick(o, "sub", "subrarity") };
  }).filter(it => it.name);
}
const miKey = (book, name) => (String(book).toLowerCase() + "|" + String(name).toLowerCase()).replace(/\s+/g, " ").trim();
async function importItemFile(file, show) {
  if (!S.canWrite || !S.canGM || !S.db) { show(`<span class="err">This copy can't save, so items can't be imported here.</span>`); return; }
  let items;
  try { items = readItemFile(await file.text(), file.name); }
  catch { show(`<span class="err">That file isn't an item list. It should be JSON with an "items" list, or a CSV with a name column.</span>`); return; }
  if (!items.length) { show(`<span class="err">No items with a name were found in that file.</span>`); return; }
  const have = new Map([...S.mod.magicitems.values()].map(d => [miKey(d.book, d.name), d]));
  let added = 0, updated = 0, n = 0;
  const now = new Date().toISOString();
  try {
    for (const it of items) {
      const old = have.get(miKey(it.book, it.name));
      const id = old ? old.id : "mi_" + uid();
      const doc = { ...(old || { created: now }), ...it, updated: now, id };
      S.mod.magicitems.set(id, doc); have.set(miKey(it.book, it.name), doc);
      await R(MP("magicitems") + "/" + id).set(doc);
      old ? updated++ : added++;
      if (++n % 25 === 0) show(`Importing… ${n} of ${items.length}`);
    }
  } catch (e) { handleWriteError(e); }
  const books = [...new Set(items.map(i => i.book))];
  S.mi.book = books.length === 1 ? books[0] : "";
  show(`<span class="ok">${added ? `Added ${added}` : ""}${added && updated ? ", " : ""}${updated ? `updated ${updated}` : ""} item${added + updated === 1 ? "" : "s"} from ${books.map(b => `“${esc(b)}”`).join(", ")} in “${esc(S.meta.name)}”. They're in the Magic Items tab, Quick Lookup and Reference.</span>`);
  toast(`Imported ${added + updated} item${added + updated === 1 ? "" : "s"}`);
  render();
}
document.addEventListener("change", async e => {
  const el = e.target; if (!el || (el.id !== "mi-file" && el.id !== "items-in")) return;
  const f = el.files[0]; if (!f) return;
  if (el.id === "mi-file") { S.miImpMsg = "Reading…"; renderModule(); await importItemFile(f, h => { S.miImpMsg = h; const box = $("#mi-imp-msg"); if (box) box.innerHTML = h; }); }
  else { $("#items-msg").textContent = "Reading…"; await importItemFile(f, h => { $("#items-msg").innerHTML = h; }); }
  el.value = "";
});
(() => {
  const at = [...document.querySelectorAll("#backup .section-title")].find(h => h.textContent.trim() === "Load a file");
  if (!at) return;
  at.insertAdjacentHTML("beforebegin", `<h3 class="section-title">Import items</h3>
    <p class="hint" style="margin:0">A book's magic items as JSON or CSV (name, type, rarity, attunement, description, book, page, and optional GM notes). They go into this campaign's Magic Items tab, tagged with their book. Importing the same book again updates its items.</p>
    <input type="file" id="items-in" accept=".json,.csv,application/json,text/csv">
    <span id="items-msg"></span>`);
})();

/* ----- actions ----- */
Object.assign(ACTIONS, {
  "mi-new": () => {
    const id = "mi_" + uid();
    putDoc("magicitems", id, { name: "New item", type: "Wondrous item", rarity: "uncommon", attunement: "", description: "", book: "Homebrew", page: "", notes: "", created: new Date().toISOString() }, false);
    S.mi = { q: "", book: "", rar: "", type: "", att: "" }; S.sel.magicitems = "mi:" + id; S.miEdit = id; render();
    setTimeout(() => { const el = document.querySelector('.mi-edit [data-p="name"]'); el?.focus(); el?.select(); }, 40);
  },
  "mi-edit": d => { S.miEdit = S.miEdit === d.id ? null : d.id; render(); },
  "mi-del": d => { S.confirm = null; S.miEdit = null; delDoc("magicitems", d.id); toast("Item deleted"); },
  "mi-copy": d => {
    const src = MI_SRD.find(x => x.id === d.id); if (!src) return;
    const id = "mi_" + uid();
    putDoc("magicitems", id, { name: src.name + " (homebrew)", type: src.type, rarity: miRarity(src.rarity) || "uncommon", attunement: src.attunement, description: src.description, book: "Homebrew", page: "", notes: `Copied from ${SRD_BOOK}.`, created: new Date().toISOString() }, false);
    S.mi.book = ""; S.sel.magicitems = "mi:" + id; S.miEdit = id; render();
  },
});

Object.assign(ACTIONS, {
  "mi-to-enc": d => {
    const x = miFind(d.id), encId = $("#mi-enc")?.value; if (!x || !encId) return;
    const c = docCopy("combats", encId), line = `- ${x.name}${miLine(x) ? ` (${miLine(x)})` : ""}, ${miTag(x)}`;
    c.loot = (c.loot ? c.loot.replace(/\s+$/, "") + "\n" : "") + line;
    putDoc("combats", encId, c, false); render();
    toast(`${x.name} added to the loot of “${c.title || "encounter"}”`);
  },
  "mi-to-screen": d => {
    const x = miFind(d.id); if (!x) return;
    const id = "p_" + uid();
    putDoc("screen", id, { type: "item", title: x.name, ref: x.id, snap: miSnap(x) }, false);
    commit("screen", "layout", "order", [id, ...allPanels().map(p => p.id).filter(v => v !== id)]);
    commit("screen", "layout", "pos." + id, { x: 0, y: -1 });
    S.screenOff = S.screenOff.filter(v => v !== id);
    render(); toast(`${x.name} is on the DM Screen`);
  },
  "mi-card": d => {
    const x = miFind(d.id); if (!x) return;
    const have = [...S.cards.values()].find(c => c.kind === "item" && String(c.title).toLowerCase() === x.name.toLowerCase() && !c.archived);
    if (have) { toast(`There's already a card for ${x.name}`); setTab("board"); openEditor(have.id); return; }
    const now = new Date().toISOString(), c = { id: uid(), kind: "item", title: x.name, body: miCardText(x), act: "", status: "planned",
      tags: [miType(x.type), miRarity(x.rarity), x.attunement ? "attunement" : "", x.book && x.book !== "Homebrew" ? x.book : ""].filter(Boolean).map(t => t.toLowerCase()),
      order: nextOrder(""), color: "", imageId: "", links: [], miRef: x.id, created: now, updated: now };
    saveCard(c, S.canGM && x.notes ? x.notes : undefined);
    toast(`Card made for ${x.name}`); setTab("board"); setTimeout(() => openEditor(c.id), 60);
  },
  "mi-open": d => { S.mi = { q: "", book: "", rar: "", type: "", att: "" }; S.sel.magicitems = d.id; setTab("magicitems"); },
});
/* ----- Quick Lookup and Reference find imported and homebrew items too ----- */
const _refHomebrewMi = refHomebrew;
refHomebrew = function () {
  const out = _refHomebrewMi();
  if (S.mod && S.mod.magicitems) for (const d of S.mod.magicitems.values()) if (d.name) out.push({ key: "mi:" + d.id, cat: "items", label: d.book || "Homebrew", x: { n: d.name, d: d.description || "" }, mi: d, name: d.name, lname: d.name.toLowerCase(), hb: true });
  return out;
};
const _refDetailMi = refDetail;
refDetail = function (r) {
  if (r.mi) return `${miBody(r.mi)}<div><button type="button" class="btn small" data-do="mi-goto" data-id="${esc(r.mi.id)}">Open in Magic Items</button></div>`;
  return _refDetailMi(r);
};
const _refSubMi = refSub;
refSub = function (r) { if (r.mi) return [cap(miRarity(r.mi.rarity)), miType(r.mi.type)].filter(Boolean).join(" · ") || "Magic item"; return _refSubMi(r); };
ACTIONS["mi-goto"] = d => { S.mi = { q: "", book: "", rar: "", type: "", att: "" }; S.sel.magicitems = "mi:" + d.id; setTab("magicitems"); };
