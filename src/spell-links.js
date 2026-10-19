/* ===================== Spell links =====================
   Spell names in displayed text (card text on the Table, stat blocks and their
   Spellcasting lines, magic items, Quick Lookup, the timeline…) become links that
   open the full SRD 5.2 spell in a pop-up. Text you're typing in a box is never
   touched. Multi-word spells link anywhere ("hold person", "Cure Wounds");
   one-word spells only when written with a capital in the middle of a sentence
   and not part of a longer name, so "casts Shield" links but "Shield Bash",
   "the Second Light" and a sentence starting with "Fear" don't. */
const SPELL_BY = new Map(SRD.spells.map((s, n) => [s.n.toLowerCase(), n]));
const SPELL_SKIP1 = new Set(["light", "resistance", "darkvision", "creation"]); // too common as rules words
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SPELLS_MULTI = SRD.spells.map(s => s.n).filter(n => /[\s/]/.test(n)).sort((a, b) => b.length - a.length);
const SPELLS_ONE = SRD.spells.map(s => s.n).filter(n => !/[\s/]/.test(n) && !SPELL_SKIP1.has(n.toLowerCase())).sort((a, b) => b.length - a.length);
const RE_MULTI = new RegExp(`(?<![\\w'’])(${SPELLS_MULTI.map(reEsc).join("|")})(?![\\w'’])`, "gi");
const RE_ONE = new RegExp(`(?<![\\w'’])(${SPELLS_ONE.map(reEsc).join("|")})(?![\\w'’])`, "g");
const SPELL_NO = "input,textarea,select,option,button,a,script,style,h1,h2,h3,h4,.sb-head,.spell-link,.spell-pop,.spell-list,.mlist,.lvl-row,[contenteditable],.tabs,.screen-bar,label > span";
function spellMatches(text) {
  const out = [];
  for (const m of text.matchAll(RE_MULTI)) out.push([m.index, m[0]]);
  for (const m of text.matchAll(RE_ONE)) {
    const i = m.index, w = m[0];
    if (out.some(([a, s]) => i < a + s.length && a < i + w.length)) continue;
    const before = text.slice(0, i), after = text.slice(i + w.length);
    if (!/\S/.test(before) || /[.!?]["'”’)]*\s*$/.test(before) || /\n\s*$/.test(before)) continue; // start of text, sentence or line
    if (/[A-Z][\w'’]*\s+$/.test(before) && !/(^|\s)(I|A)\s+$/.test(before)) continue;           // after a capitalised word: part of a name
    if (/^\s+[A-Z][a-z]/.test(after)) continue;                                                 // before a capitalised word: "Shield Bash"
    out.push([i, w]);
  }
  return out.sort((a, b) => a[0] - b[0]);
}
function linkSpells(root) {
  if (!root || root.nodeType !== 1 || root.closest?.(SPELL_NO)) return;
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: t => t.nodeValue.length > 2 && !t.parentElement.closest(SPELL_NO) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
  for (const t of nodes) {
    const text = t.nodeValue, hits = spellMatches(text); if (!hits.length) continue;
    const frag = document.createDocumentFragment(); let at = 0;
    for (const [i, w] of hits) {
      if (i < at) continue;
      frag.append(text.slice(at, i));
      const b = document.createElement("button"); b.type = "button"; b.className = "spell-link"; b.dataset.spell = SPELL_BY.get(w.toLowerCase()); b.textContent = w; b.title = "Show the spell";
      frag.append(b); at = i + w.length;
    }
    frag.append(text.slice(at)); t.replaceWith(frag);
  }
}
/* re-link whatever the app redraws */
let spellQueue = new Set(), spellRaf = 0;
new MutationObserver(muts => {
  for (const m of muts) {
    if (m.type === "characterData") { if (m.target.parentElement && !m.target.parentElement.closest(".spell-link")) spellQueue.add(m.target.parentElement); continue; }
    for (const n of m.addedNodes) { if (n.nodeType === 1 && !n.classList?.contains("spell-link")) spellQueue.add(n); else if (n.nodeType === 3 && n.parentElement) spellQueue.add(n.parentElement); }
  }
  if (spellQueue.size && !spellRaf) spellRaf = requestAnimationFrame(() => { spellRaf = 0; const q = [...spellQueue]; spellQueue = new Set(); for (const el of q) if (el.isConnected) linkSpells(el); });
}).observe(document.body, { childList: true, subtree: true, characterData: true });
requestAnimationFrame(() => linkSpells(document.body));

/* the pop-up */
function spellPop(n, from) {
  const s = SRD.spells[n]; if (!s) return;
  let pop = document.getElementById("spell-pop");
  if (!pop) { pop = document.createElement("div"); pop.id = "spell-pop"; pop.className = "spell-pop-wrap"; document.body.appendChild(pop); }
  pop.innerHTML = `<div class="spell-pop" role="dialog" aria-modal="true" aria-label="${esc(s.n)}">
    <button type="button" class="icon-btn spell-pop-x" data-spellpop="close" aria-label="Close">×</button>
    ${refDetail({ cat: "spells", x: s, name: s.n })}
    <div class="actions"><button type="button" class="btn small" data-spellpop="ref" data-n="${n}">Open in Reference</button></div>
    <p class="credit">${SRD_CREDIT}</p></div>`;
  pop.hidden = false; pop._from = from;
  pop.querySelector(".spell-pop-x").focus();
}
function spellPopClose() { const pop = document.getElementById("spell-pop"); if (!pop || pop.hidden) return; pop.hidden = true; pop._from?.focus?.(); }
document.addEventListener("pointerdown", e => { if (e.target.closest?.(".spell-link")) e.stopPropagation(); }, true);
document.addEventListener("click", e => {
  const l = e.target.closest?.(".spell-link");
  if (l) { e.preventDefault(); e.stopPropagation(); spellPop(Number(l.dataset.spell), l); return; }
  const p = e.target.closest?.("[data-spellpop]");
  if (p) {
    e.stopPropagation();
    if (p.dataset.spellpop === "ref") { const s = SRD.spells[Number(p.dataset.n)]; spellPopClose(); S.ref.q = s.n; S.ref.cat = "spells"; S.sel.reference = null; setTab("reference"); }
    else spellPopClose();
    return;
  }
  if (e.target.id === "spell-pop") spellPopClose();
}, true);
document.addEventListener("keydown", e => { if (e.key === "Escape" && document.getElementById("spell-pop") && !document.getElementById("spell-pop").hidden) { e.stopPropagation(); spellPopClose(); } }, true);
