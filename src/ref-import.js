/* ===================== Imported reference entries =====================
   Spells, feats, subclasses, backgrounds, species notes, equipment and vehicles
   from other books, imported per campaign (gmx/<board>/refhb, so they travel
   with backups and GitHub saves, never in the site's code). They appear in the
   Reference tab and Quick Lookup with their book as a tagline, and imported
   spells work with the spell-name pop-ups. Imported through Import homebrew:
   { "book": "…", "reference": [ { cat, name, subtitle, description, page, notes,
     (spells:) level, school, castingTime, range, components, duration,
     concentration, ritual, classes, higherLevels } ] } */
MOD_COLLS.push("refhb");
const RH_CATS = [["spells", "Spells"], ["feats", "Feats"], ["subclasses", "Subclasses"], ["backgrounds", "Backgrounds"], ["species", "Species"], ["equipment", "Equipment"], ["vehicles", "Mounts & vehicles"]];
const rhDocs = () => [...((S.mod && S.mod.refhb) || new Map()).values()].filter(d => d && d.name);
function rhX(d) {
  if (d.cat === "spells") return { n: d.name, lv: int(d.level), sc: d.school || "", ct: d.castingTime || "", rg: d.range || "", co: d.components || "", du: d.duration || "", cn: !!d.concentration, ri: !!d.ritual, cl: d.classes || "", d: d.description || "", h: d.higherLevels || "" };
  return { n: d.name, d: d.description || "", ca: d.subtitle || "" };
}
function rhEntry(d) {
  const label = (RH_CATS.find(c => c[0] === d.cat) || REF_CATS.find(c => c[0] === d.cat) || [, d.cat || "Reference"])[1];
  return { key: "rh:" + d.id, cat: d.cat, label, x: rhX(d), rh: d, name: d.name, lname: d.name.toLowerCase(), hb: true };
}
/* searchable everywhere the SRD is */
const _refHomebrewRh = refHomebrew;
refHomebrew = function () { return [..._refHomebrewRh(), ...rhDocs().map(rhEntry)]; };
const _refSubRh = refSub;
refSub = function (r) { if (r.rh) return r.rh.cat === "spells" ? _refSubRh({ ...r, rh: null }) : (r.rh.subtitle || r.label); return _refSubRh(r); };
const _refDetailRh = refDetail;
refDetail = function (r) {
  if (!r.rh) return _refDetailRh(r);
  const d = r.rh, tag = `${d.book || "Imported"}${d.page ? ` · p. ${d.page}` : ""}`;
  let html = _refDetailRh({ ...r, rh: null, card: null, mi: null });
  html = html.replace(/<\/div><\/div>/, `</div><div class="mi-book">${esc(tag)}</div></div>`);
  if (d.cat !== "spells" && d.subtitle) html = html.replace(/<div class="sb-type">[^<]*<\/div>/, `<div class="sb-type">${esc(d.subtitle)}</div>`);
  if (S.canGM && d.notes) html += `<div class="mi-notes"><b>GM notes</b>${md(d.notes)}</div>`;
  return html;
};
/* categories in the Reference filter: the SRD ones plus any imported ones, with counts */
const _refCatsRh = refCats;
refCats = function () {
  const counts = {}; for (const d of rhDocs()) counts[d.cat] = (counts[d.cat] || 0) + 1;
  const base = _refCatsRh().map(([c, l, n]) => [c, l, n + (counts[c] || 0)]);
  const extra = RH_CATS.filter(([c]) => !base.some(b => b[0] === c) && counts[c]).map(([c, l]) => [c, l, counts[c]]);
  return [...base, ...extra];
};
/* imported spells in the spell pop-ups */
function refhbSpell(id) { const d = S.mod?.refhb?.get(id); return d && d.cat === "spells" ? rhEntry(d) : null; }
const _rhRenderModule = renderModule;
renderModule = function () {
  const r = _rhRenderModule.apply(this, arguments);
  if (typeof spellIndex === "function" && spellIndex(rhDocs().filter(d => d.cat === "spells").map(d => [d.name, "rh:" + d.id]))) requestAnimationFrame(() => linkSpells(document.body));
  return r;
};
/* the import step, called from Import homebrew */
async function refhbImport(list, book) {
  const have = new Map(rhDocs().map(d => [`${(d.book || "").toLowerCase()}|${d.cat}|${d.name.toLowerCase()}`, d]));
  const now = new Date().toISOString(); let added = 0, updated = 0;
  const pick = (o, ...ks) => { for (const k of ks) if (o[k] != null && String(o[k]).trim() !== "") return o[k]; return ""; };
  for (const o of list) {
    const name = String(pick(o, "name", "title")).trim(); if (!name) continue;
    const cat = String(pick(o, "cat", "category") || "feats").toLowerCase();
    const b = String(pick(o, "book") || book || "Imported");
    const doc = { cat, name, book: b, page: String(pick(o, "page")), subtitle: String(pick(o, "subtitle")), description: String(pick(o, "description", "summary", "text")), notes: String(pick(o, "notes", "gm")) };
    if (cat === "spells") Object.assign(doc, { level: int(pick(o, "level")), school: String(pick(o, "school")), castingTime: String(pick(o, "castingTime")), range: String(pick(o, "range")), components: String(pick(o, "components")),
      duration: String(pick(o, "duration")), concentration: !!o.concentration, ritual: !!o.ritual, classes: String(pick(o, "classes")), higherLevels: String(pick(o, "higherLevels")) });
    const key = `${b.toLowerCase()}|${cat}|${name.toLowerCase()}`, old = have.get(key);
    const id = old ? old.id : "rh_" + uid(), full = { ...(old || { created: now }), ...doc, updated: now, id };
    S.mod.refhb.set(id, full); have.set(key, full);
    await R(MP("refhb") + "/" + id).set(full);
    old ? updated++ : added++;
  }
  return { added, updated };
}
